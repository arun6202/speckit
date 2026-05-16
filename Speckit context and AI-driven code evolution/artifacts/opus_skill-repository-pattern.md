# Skill: repository-pattern

**Target path in repo**: `/skills/repository-pattern.md`  
**Applies law**: LAW-5 (Repository Boundary), LAW-6 (Stock Concurrency)  
**Source**: Derived from 3 production data access incidents. Reviewed by @arch-lead 2026-05-16.  
**When to use**: Any time you read from or write to the database from a plugin or service

---

## The Sanctioned Data Access Pattern

```csharp
// ─────────────────────────────────────────────────────────────────────────────
// IRepository<T> — the ONLY approved data access pattern outside Nop.Data
// ─────────────────────────────────────────────────────────────────────────────
public class YourPluginService : IYourPluginService
{
    // Inject IRepository<T> for entities you own
    private readonly IRepository<YourEntity> _yourEntityRepository;
    // Inject domain services for entities you don't own
    private readonly IProductService _productService;  // NOT IRepository<Product>

    public YourPluginService(
        IRepository<YourEntity> yourEntityRepository,
        IProductService productService)
    {
        _yourEntityRepository = yourEntityRepository;
        _productService = productService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ: GetAllAsync with predicate
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<IList<YourEntity>> GetActiveRecordsAsync(int storeId)
    {
        return await _yourEntityRepository.GetAllAsync(query =>
        {
            return query
                .Where(e => !e.Deleted)       // Soft-delete filter (also applied by IRepository)
                .Where(e => e.StoreId == storeId || e.StoreId == 0)  // Store scoping
                .Where(e => e.IsActive)
                .OrderBy(e => e.DisplayOrder);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ: GetByIdAsync — single entity by PK
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<YourEntity> GetByIdAsync(int id)
    {
        // Returns null if not found OR if soft-deleted (Deleted=true)
        return await _yourEntityRepository.GetByIdAsync(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE: Insert
    // ─────────────────────────────────────────────────────────────────────────
    public async Task InsertRecordAsync(YourEntity entity)
    {
        if (entity == null)
            throw new ArgumentNullException(nameof(entity));

        entity.CreatedOnUtc = DateTime.UtcNow;
        await _yourEntityRepository.InsertAsync(entity);
        // InsertAsync: calls DbContext.Add, SaveChanges, fires EntityInserted<T> event
        // EntityInserted<T> triggers cache invalidation in IStaticCacheManager
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE: Update
    // ─────────────────────────────────────────────────────────────────────────
    public async Task UpdateRecordAsync(YourEntity entity)
    {
        if (entity == null)
            throw new ArgumentNullException(nameof(entity));

        entity.UpdatedOnUtc = DateTime.UtcNow;
        await _yourEntityRepository.UpdateAsync(entity);
        // UpdateAsync: calls DbContext.Update, SaveChanges, fires EntityUpdated<T> event
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE: Soft delete (preferred over hard delete)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task DeleteRecordAsync(YourEntity entity)
    {
        // If entity has Deleted column: soft delete
        entity.Deleted = true;
        await _yourEntityRepository.UpdateAsync(entity);

        // If entity does NOT have Deleted column: hard delete
        // await _yourEntityRepository.DeleteAsync(entity);
    }
}
```

---

## What IRepository<T> Does for You

```
InsertAsync(entity)  → DbContext.Add(entity)
                      → SaveChanges()
                      → Publish EntityInserted<T> event
                      → EntityInserted<T> triggers IConsumer<EntityInserted<T>> handlers
                      → Handlers include SearchIndexPlugin (indexes product on insert)

UpdateAsync(entity)  → DbContext.Update(entity)
                      → SaveChanges()
                      → Publish EntityUpdated<T> event

DeleteAsync(entity)  → DbContext.Remove(entity)
                      → SaveChanges()
                      → Publish EntityDeleted<T> event

Soft-delete filter   → IRepository<T>.Table already applies WHERE Deleted=0
                       GetByIdAsync returns null for soft-deleted entities automatically
```

If you bypass `IRepository<T>` and write directly to `NopDbContext`, NONE of the above events fire. Cache is not invalidated. Search index is not updated. Audit trail is broken.

---

## LAW-5: What Not to Do

```csharp
// ❌ WRONG: Direct DbContext injection — bypasses cache, events, soft-delete filter
public class WrongService
{
    private readonly NopDbContext _dbContext;  // NEVER inject this in a plugin/service

    public async Task<List<Product>> GetProducts()
    {
        // Soft-delete NOT filtered — returns deleted products
        // EntityUpdated<Product> NOT published — search index NOT updated
        // Cache NOT invalidated — stale data served
        return await _dbContext.Products.Where(p => p.Published).ToListAsync();
    }
}

// ❌ WRONG: Raw ADO.NET or Dapper for writes
using var cmd = connection.CreateCommand();
cmd.CommandText = "UPDATE Product SET StockQuantity = @qty WHERE Id = @id";
// No EF change tracking — no event published — cache not invalidated

// ✅ CORRECT: Always use IRepository<T> or domain service
private readonly IProductService _productService;
var products = await _productService.SearchProductsAsync(storeId: storeId, visibleIndividuallyOnly: true);
```

---

## Cross-Entity Access: Use Domain Services, Not Repositories

```csharp
// ─────────────────────────────────────────────────────────────────────────────
// Rule: Only inject IRepository<T> for entities YOUR PLUGIN OWNS.
//       For entities owned by core (Product, Order, Customer): use domain services.
// ─────────────────────────────────────────────────────────────────────────────

// ❌ WRONG: Plugin directly querying IRepository<Product>
private readonly IRepository<Product> _productRepo;  // Plugin does NOT own Product

// ✅ CORRECT: Use IProductService (it owns the cache + events for Product)
private readonly IProductService _productService;
var product = await _productService.GetProductByIdAsync(productId);

// Domain service ownership guide:
// IProductService     → Product, ProductAttributeMapping, StockQuantityHistory
// IOrderService       → Order, OrderItem, OrderNote
// ICustomerService    → Customer, CustomerRole, CustomerPassword
// IDiscountService    → Discount, DiscountUsageHistory
// IShippingService    → Shipment, ShipmentItem
// IManufacturerService → Manufacturer, ProductManufacturerMapping
// ICategoryService    → Category, ProductCategoryMapping
```

---

## LAW-6: Optimistic Concurrency for Stock Updates

```csharp
// ─────────────────────────────────────────────────────────────────────────────
// Product.StockQuantity is written by:
//   1. IOrderService.PlaceOrderAsync (inside SERIALIZABLE transaction)
//   2. InventoryPlugin.HandleEvent<OrderPlacedEvent> (after event dispatch)
// Both run on order placement — race condition is expected and handled via
// optimistic concurrency (RowVersion) + retry.
// ─────────────────────────────────────────────────────────────────────────────
public async Task DecrementStockAsync(int productId, int quantity)
{
    const int maxRetries = 3;

    for (var attempt = 0; attempt < maxRetries; attempt++)
    {
        try
        {
            // Always reload inside the retry loop — get current RowVersion
            var product = await _productRepository.GetByIdAsync(productId);

            if (product == null || !product.ManageInventory)
                return;

            if (product.StockQuantity < quantity)
            {
                _logger.LogWarning(
                    "Insufficient stock for product {ProductId}: have {Stock}, need {Qty}",
                    productId, product.StockQuantity, quantity);
                return;
            }

            product.StockQuantity -= quantity;
            await _productRepository.UpdateAsync(product);
            // UpdateAsync uses RowVersion — if another process updated between
            // GetByIdAsync and UpdateAsync, throws DbUpdateConcurrencyException
            return;  // Success
        }
        catch (DbUpdateConcurrencyException)
        {
            if (attempt == maxRetries - 1)
            {
                _logger.LogError(
                    "Stock update failed after {MaxRetries} attempts for product {ProductId}",
                    maxRetries, productId);
                throw;
            }
            // Loop continues — reload inside loop gets fresh RowVersion
        }
    }
}
```

---

## Bulk Operations Pattern

```csharp
// For bulk inserts (e.g., ERP sync queue batch)
// Use BulkInsertAsync from IRepository — more efficient than N individual inserts
var records = orders.Select(o => new ErpSyncQueue
{
    OrderId = o.Id,
    Status = ErpSyncStatus.Pending,
    CreatedOnUtc = DateTime.UtcNow
}).ToList();

await _erpSyncQueueRepository.InsertAsync(records);
// BulkInsertAsync: single SQL batch, does NOT publish EntityInserted<T> per row
// Use only when event-per-row is not required (e.g., queue tables, log tables)
```

---

## Migration Pattern (for New Plugin Tables)

```csharp
// All plugin migrations live in the plugin assembly, not Nop.Data
// Migration class convention: Nop_{PluginVersion}_{MigrationName}Migration

[NopMigration("2026.05.16.00", "YourPlugin — Add ErpSyncQueue table",
    MigrationProcessType.Installation)]
public class AddErpSyncQueueTableMigration : AutoReversingMigration
{
    public override void Up()
    {
        Create.Table("YourPlugin_ErpSyncQueue")
            .WithColumn("Id").AsInt32().PrimaryKey().Identity()
            .WithColumn("OrderId").AsInt32().NotNullable()
            .WithColumn("Status").AsInt32().NotNullable().WithDefaultValue(0)
            .WithColumn("Attempts").AsInt32().NotNullable().WithDefaultValue(0)
            .WithColumn("CreatedOnUtc").AsDateTime2().NotNullable()
            .WithColumn("UpdatedOnUtc").AsDateTime2().Nullable();

        Create.ForeignKey()
            .FromTable("YourPlugin_ErpSyncQueue").ForeignColumn("OrderId")
            .ToTable("Order").PrimaryColumn("Id");
    }
}
```

---

## Verification Checklist

- [ ] `IRepository<T>` used for all data access — no direct `NopDbContext` injection (LAW-5)
- [ ] Domain services used for entities not owned by this plugin (Product → `IProductService`, etc.)
- [ ] Stock updates use optimistic concurrency + retry loop (LAW-6)
- [ ] Soft-delete set on entity (not hard delete) unless entity has no `Deleted` column
- [ ] Bulk operations use `BulkInsertAsync` only for queue/log tables (no per-row event needed)
- [ ] Migration class follows naming convention and is in plugin assembly (not Nop.Data)
- [ ] No raw ADO.NET or Dapper writes that bypass EF change tracking
