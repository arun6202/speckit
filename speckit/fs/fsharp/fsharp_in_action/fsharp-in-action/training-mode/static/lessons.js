const lessonCode = String.raw;

window.FIA_LESSONS = [
  {
    id: "02",
    number: "1",
    title: "First F# Shapes",
    files: ["02/Sample2.fsx", "02/Scratchpad.fsx", "02/helloworld"],
    summary: "Start with pipelines, small transformations, and a train domain model made from records and discriminated unions.",
    steps: [
      {
        title: "Pipeline Data",
        concept: "A pipeline passes the value on the left into the function on the right. Function composition lets you name a whole transformation.",
        task: "Run the code, then change the source range to [ 1..20 ].",
        expected: "Only even numbers are kept, then each even number is squared.",
        code: lessonCode`
let getEvenNumbers = Seq.filter (fun number -> number % 2 = 0)
let squareNumbers = Seq.map (fun x -> x * x)
let getEvenNumbersThenSquare = getEvenNumbers >> squareNumbers

let evenNumbersSquared = [ 1..10 ] |> getEvenNumbersThenSquare |> Seq.toList
printfn "%A" evenNumbersSquared
`
      },
      {
        title: "Domain Types",
        concept: "Records group named values. Discriminated unions model choices where each case can carry different data.",
        task: "Run the train model, then add Wifi to the carriage features.",
        expected: "The output shows a first-class passenger carriage with strongly typed fields.",
        code: lessonCode`
open System

type Feature = Quiet | Wifi | PowerSockets
type CarriageClass = First | Second
type CarriageKind =
    | Passenger of CarriageClass
    | Buffet of {| ColdFood: bool; HotFood: bool |}

type CarriageNumber = CarriageNumber of int
type Carriage = {
    Number: CarriageNumber
    Kind: CarriageKind
    Features: Feature Set
    NumberOfSeats: int
}

let carriage = {
    Number = CarriageNumber 1
    Kind = Passenger First
    Features = Set [ Quiet; PowerSockets ]
    NumberOfSeats = 42
}

printfn "%A" carriage
`
      },
      {
        title: "Hello Project Logic",
        concept: "A console project still starts with small values and functions. The same script habits transfer into Program.fs.",
        task: "Change the name value and run again.",
        expected: "The greeting is printed from a function, not hard-coded at the call site.",
        code: lessonCode`
let greeting name = $"Hello, {name}. Welcome to F#."
let name = "Isaac"

printfn "%s" (greeting name)
`
      }
    ]
  },
  {
    id: "03",
    number: "2",
    title: "Let, Scope, and Inference",
    files: ["03/Sample3.fsx"],
    summary: "Break calculations into let-bound values, learn nested scope, and let the compiler infer most types.",
    steps: [
      {
        title: "Let-Bound Steps",
        concept: "A function body can name intermediate values. The last expression is the return value.",
        task: "Run the function, then pass 20 instead of 5.",
        expected: "The function prints the intermediate calculation and returns the final integer.",
        code: lessonCode`
let addTenThenDouble theNumber =
    let addedTen = theNumber + 10
    let answer = addedTen * 2
    printfn $"({theNumber} + 10) * 2 is {answer}"
    answer

let result = addTenThenDouble 5
printfn "Returned: %d" result
`
      },
      {
        title: "Nested Scope",
        concept: "A value created inside a nested block is only visible inside that block. Return the value you want to use outside.",
        task: "Run the code, then change the city to another location.",
        expected: "The outer expression can use fullName because the inner block returns it.",
        code: lessonCode`
let greetingText =
    let fullName =
        let firstName = "Frank"
        let lastName = "Schmidt"
        $"{firstName} {lastName}"

    $"Greetings, {fullName} from London"

printfn "%s" greetingText
`
      },
      {
        title: "Inference With Hints",
        concept: "F# infers types from usage, but annotations help when member calls need a known type.",
        task: "Run it, then remove the DateTime annotation and observe the compiler error.",
        expected: "With the annotation, AddDays and AddYears are available.",
        code: lessonCode`
let addThreeDays (theDate: System.DateTime) =
    theDate.AddDays 3

let addAYearAndThreeDays (theDate: System.DateTime) =
    let threeDaysForward = addThreeDays theDate
    threeDaysForward.AddYears 1

printfn "%A" (addAYearAndThreeDays (System.DateTime(2026, 6, 7)))
`
      }
    ]
  },
  {
    id: "04",
    number: "3",
    title: "Expressions and Immutability",
    files: ["04/1-Expressions.fsx", "04/2-Immutability.fsx"],
    summary: "Treat if/then/else as expressions, understand unit for side effects, and prefer immutable state transitions.",
    steps: [
      {
        title: "If Is an Expression",
        concept: "An if expression returns a value, so both branches must produce compatible types.",
        task: "Run it, then try ages 12, 42, and 80.",
        expected: "The selected branch becomes the ageDescription value.",
        code: lessonCode`
let calculateAgeDescription age =
    if age < 18 then "Child"
    elif age < 65 then "Adult"
    else "OAP"

let describeAge age =
    let ageDescription = calculateAgeDescription age
    $"Hello! You are an '{ageDescription}'."

printfn "%s" (describeAge 42)
`
      },
      {
        title: "Unit for Effects",
        concept: "Functions that mainly perform side effects often return unit, written ().",
        task: "Run it, then change the numbers being printed.",
        expected: "The printed line is the useful effect; the function result is unit.",
        code: lessonCode`
let printAddition a b =
    let answer = a + b
    printfn $"{a} plus {b} equals {answer}."

let result = printAddition 4 8
printfn "Function returned: %A" result
`
      },
      {
        title: "Immutable State",
        concept: "Instead of mutating gas, return the next gas value and pass it to the next call.",
        task: "Run the route, then add another drive step.",
        expected: "Each state is named and the final result is deterministic.",
        code: lessonCode`
let drive gas distance =
    if distance > 50 then gas / 2.0
    elif distance > 25 then gas - 10.0
    elif distance > 0 then gas - 1.0
    else gas

let initialState = 100.0
let firstState = drive initialState 55
let secondState = drive firstState 26
let finalState = drive secondState 1

printfn "Final gas: %.1f" finalState
`
      }
    ]
  },
  {
    id: "05",
    number: "4",
    title: "Tuples and Records",
    files: ["05/1-Tuples.fsx", "05/2-Records.fsx"],
    summary: "Use tuples for lightweight grouping and records for named, comparable domain data.",
    steps: [
      {
        title: "Tuple Deconstruction",
        concept: "Tuples are positional. Pattern matching can unpack only the fields you need.",
        task: "Run it, then change the surname.",
        expected: "makeDoctor ignores the first tuple field and keeps the surname.",
        code: lessonCode`
let makeDoctor (_, surname) =
    "Dr", surname

let title, name = makeDoctor ("Jane", "Smith")
printfn "%s %s" title name
`
      },
      {
        title: "Record Construction",
        concept: "Records make data self-documenting through field names and structural equality.",
        task: "Run it, then change the age and description rule.",
        expected: "The record prints with named fields.",
        code: lessonCode`
type Person = {
    Name: string
    Age: int
    Description: string
}

let buildPerson forename surname age = {
    Name = $"{forename} {surname}"
    Age = age
    Description = if age < 18 then "child" else "adult"
}

printfn "%A" (buildPerson "Jane" "Smith" 17)
`
      },
      {
        title: "Copy and Update",
        concept: "Record copy-and-update creates a modified copy without changing the original.",
        task: "Run it, then change the country on the copied address.",
        expected: "The original and updated addresses are different values.",
        code: lessonCode`
type Address = { Town: string; Country: string }

let london = { Town = "London"; Country = "UK" }
let berlin = { london with Town = "Berlin"; Country = "DE" }

printfn "Original: %A" london
printfn "Updated:  %A" berlin
`
      }
    ]
  },
  {
    id: "06",
    number: "5",
    title: "Functions, Modules, and Pipelines",
    files: ["06/1-Functions.fsx", "06/2-Namespaces.fsx", "06/3-Modules.fsx", "06/drivingapp"],
    summary: "Build larger behavior with curried functions, partial application, modules, and readable pipelines.",
    steps: [
      {
        title: "Partial Application",
        concept: "Curried functions can be called one argument at a time, producing new specialized functions.",
        task: "Run it, then create addTwenty.",
        expected: "addFive is a reusable one-argument function.",
        code: lessonCode`
let add firstNumber secondNumber = firstNumber + secondNumber
let addFive = add 5

printfn "%d" (addFive 10)
printfn "%d" (addFive 20)
`
      },
      {
        title: "Pipeline Order",
        concept: "Pipelines make nested transformations read left to right.",
        task: "Run it, then add a final multiply by 3.",
        expected: "The piped value matches the manually nested calculation.",
        code: lessonCode`
let add a b = a + b
let multiply a b = a * b

let pipelineCalc =
    10
    |> add 5
    |> add 7
    |> multiply 2

printfn "%d" pipelineCalc
`
      },
      {
        title: "Module Boundary",
        concept: "Modules group related functions and give callers a clear name for behavior.",
        task: "Run it, then add a stop function that leaves gas unchanged.",
        expected: "Driving logic is called through the Driving module.",
        code: lessonCode`
module Driving =
    let drive distance gas =
        if distance > 50 then gas / 2.0
        elif distance > 25 then gas - 10.0
        elif distance > 0 then gas - 1.0
        else gas

let finalGas =
    100.0
    |> Driving.drive 55
    |> Driving.drive 26
    |> Driving.drive 1

printfn "%.1f" finalGas
`
      }
    ]
  },
  {
    id: "07",
    number: "6",
    title: "Collections and Aggregations",
    files: ["07/1-HOFs.fsx", "07/2-Pipelines.fsx", "07/3-CollectionTypes.fsx", "07/4-Aggregations.fsx"],
    summary: "Replace loops with higher-order collection functions, then aggregate meaningful domain answers.",
    steps: [
      {
        title: "Filter and Count",
        concept: "List.filter keeps matching values; List.length turns the filtered list into a count.",
        task: "Run it, then count games involving Bale Town.",
        expected: "The count is based on home or away team matches.",
        code: lessonCode`
type Result = { HomeTeam: string; HomeGoals: int; AwayTeam: string; AwayGoals: int }
let create home hg away ag = { HomeTeam = home; HomeGoals = hg; AwayTeam = away; AwayGoals = ag }

let results = [
    create "Messiville" 1 "Ronaldo City" 2
    create "Messiville" 1 "Bale Town" 3
    create "Ronaldo City" 2 "Bale Town" 3
    create "Bale Town" 2 "Messiville" 1
]

results
|> List.filter (fun r -> r.AwayTeam = "Ronaldo City" || r.HomeTeam = "Ronaldo City")
|> List.length
|> printfn "Games: %d"
`
      },
      {
        title: "Count By",
        concept: "List.countBy groups values by a key and returns counts in one pass.",
        task: "Run it, then switch the rule to home wins.",
        expected: "The team with the most away wins is selected.",
        code: lessonCode`
type Result = { HomeTeam: string; HomeGoals: int; AwayTeam: string; AwayGoals: int }
let create home hg away ag = { HomeTeam = home; HomeGoals = hg; AwayTeam = away; AwayGoals = ag }
let results = [
    create "Messiville" 1 "Ronaldo City" 2
    create "Messiville" 1 "Bale Town" 3
    create "Ronaldo City" 2 "Bale Town" 3
    create "Bale Town" 2 "Messiville" 1
]

let isAwayWin result = result.AwayGoals > result.HomeGoals

let winner =
    results
    |> List.filter isAwayWin
    |> List.countBy (fun result -> result.AwayTeam)
    |> List.maxBy snd

printfn "%A" winner
`
      },
      {
        title: "Collect and Sum",
        concept: "List.collect maps each item to many items, then flattens the result.",
        task: "Run it, then add another match to the list.",
        expected: "Every team's goals are summed across home and away games.",
        code: lessonCode`
type Result = { HomeTeam: string; HomeGoals: int; AwayTeam: string; AwayGoals: int }
let create home hg away ag = { HomeTeam = home; HomeGoals = hg; AwayTeam = away; AwayGoals = ag }
let results = [
    create "Messiville" 1 "Ronaldo City" 2
    create "Messiville" 1 "Bale Town" 3
    create "Ronaldo City" 2 "Bale Town" 3
    create "Bale Town" 2 "Messiville" 1
]

results
|> List.collect (fun r -> [
    {| Team = r.HomeTeam; Goals = r.HomeGoals |}
    {| Team = r.AwayTeam; Goals = r.AwayGoals |}
])
|> List.groupBy (fun row -> row.Team)
|> List.map (fun (team, rows) -> team, rows |> List.sumBy (fun row -> row.Goals))
|> List.maxBy snd
|> printfn "%A"
`
      }
    ]
  },
  {
    id: "08",
    number: "7",
    title: "Pattern Matching and Unions",
    files: ["08/1-PatternMatching.fsx", "08/2-AdvancedPatternMatching.fsx", "08/3-DiscriminatedUnions.fsx"],
    summary: "Use match expressions to branch on structure, then model alternatives with discriminated unions.",
    steps: [
      {
        title: "Match Records",
        concept: "Pattern matching can inspect record fields and bind values in one expression.",
        task: "Run it, then add a teenager case.",
        expected: "The first matching pattern decides the description.",
        code: lessonCode`
type Customer = { Name: string; Age: int }

let describe customer =
    match customer with
    | { Age = age } when age < 18 -> $"{customer.Name} is a child"
    | { Age = age } when age >= 65 -> $"{customer.Name} is retired"
    | _ -> $"{customer.Name} is an adult"

printfn "%s" (describe { Name = "Isaac"; Age = 42 })
`
      },
      {
        title: "Contact Union",
        concept: "A union describes one of several possible shapes. Matching forces you to handle each case.",
        task: "Run it, then switch contact to Telephone.",
        expected: "The message changes based on the contact method case.",
        code: lessonCode`
type ContactMethod =
    | Email of address: string
    | Telephone of country: string * number: string
    | Post of line1: string * city: string

let send message contact =
    match contact with
    | Email address -> $"Emailing '{message}' to {address}."
    | Telephone(country, number) -> $"Calling {country}-{number}."
    | Post(line1, city) -> $"Posting '{message}' to {line1}, {city}."

printfn "%s" (send "Welcome" (Email "isaac@example.com"))
`
      },
      {
        title: "Single-Case Safety",
        concept: "Single-case unions give primitive values a domain-specific type.",
        task: "Run it, then try sending an invalid email.",
        expected: "Validation must happen before sendEmail accepts the address.",
        code: lessonCode`
type Email = Email of string
type ValidatedEmail = ValidatedEmail of Email

let validateEmail (Email address) =
    if address.Contains "@" then
        Ok(ValidatedEmail(Email address))
    else
        Error "Invalid email"

let sendEmail (ValidatedEmail(Email address)) =
    $"Sent welcome email to {address}"

let result =
    Email "isaac@example.com"
    |> validateEmail
    |> Result.map sendEmail

printfn "%A" result
`
      }
    ]
  },
  {
    id: "09",
    number: "8",
    title: "Options, Results, and Workflows",
    files: ["09/1-Options.fsx", "09/2-Results.fsx", "09/3-ComputationExpressions.fsx", "09/4-DomainModelling.fsx"],
    summary: "Make absence explicit with Option, validation explicit with Result, and composition readable with small workflows.",
    steps: [
      {
        title: "Parse to Option",
        concept: "Option says a value might be present or absent without using null.",
        task: "Run it, then parse a non-number string.",
        expected: "Good input becomes Some; bad input becomes None.",
        code: lessonCode`
open System

let tryParseNumber (numberAsString: string) =
    match Int32.TryParse numberAsString with
    | true, number -> Some number
    | false, _ -> None

let total =
    match tryParseNumber "1", tryParseNumber "2", tryParseNumber "3" with
    | Some a, Some b, Some c -> Some(a + b * c)
    | _ -> None

printfn "%A" total
`
      },
      {
        title: "Validate to Result",
        concept: "Result carries either a valid value or a meaningful error.",
        task: "Run it, then change CustomerId to C123.",
        expected: "Invalid input returns Error rather than throwing.",
        code: lessonCode`
type CustomerId = CustomerId of int
type RawCustomer = { CustomerId: string; Country: string }

type Country = Domestic | Foreign of string
type Customer = { Id: CustomerId; Country: Country }

let validateCustomer raw =
    let customerId =
        if raw.CustomerId.StartsWith "C" then Ok(CustomerId(int raw.CustomerId[1..]))
        else Error $"Invalid Customer Id '{raw.CustomerId}'."

    let country =
        match raw.Country with
        | "" -> Error "No country supplied"
        | "USA" -> Ok Domestic
        | other -> Ok(Foreign other)

    match customerId, country with
    | Ok id, Ok country -> Ok { Id = id; Country = country }
    | Error err, _
    | _, Error err -> Error err

printfn "%A" (validateCustomer { CustomerId = "123"; Country = "" })
`
      },
      {
        title: "Tiny Option Workflow",
        concept: "Computation expressions can hide repetitive match plumbing when chaining optional values.",
        task: "Run it, then make one input fail.",
        expected: "The workflow returns Some only when every let! succeeds.",
        code: lessonCode`
open System

type OptionBuilder() =
    member _.Bind(value, binder) = Option.bind binder value
    member _.Return(value) = Some value

let maybe = OptionBuilder()

let tryParseNumber (text: string) =
    match Int32.TryParse text with
    | true, number -> Some number
    | false, _ -> None

let result = maybe {
    let! a = tryParseNumber "1"
    let! b = tryParseNumber "2"
    let! c = tryParseNumber "3"
    return a + b * c
}

printfn "%A" result
`
      }
    ]
  },
  {
    id: "10",
    number: "9",
    title: "Data, Serialization, and Practices",
    files: ["10/1-BestPractices.fsx", "10/2-Serialization.fsx", "10/3-TypeProviders.fsx", "10/4-DataVisualization.fsx"],
    summary: "Work with events, sequences, JSON, and data-oriented transformations while keeping examples runnable.",
    steps: [
      {
        title: "Sequence Expressions",
        concept: "A seq expression lazily yields values. Nothing is produced until the sequence is consumed.",
        task: "Run it, then change the range or filter.",
        expected: "Only the first five even squares are printed.",
        code: lessonCode`
let evenSquares =
    seq {
        for number in 1..100 do
            if number % 2 = 0 then
                yield number * number
    }

evenSquares
|> Seq.take 5
|> Seq.toList
|> printfn "%A"
`
      },
      {
        title: "Traverse Results",
        concept: "Traverse turns a list of Result values into one Result containing either all successes or collected failures.",
        task: "Run it, then make all entries Ok.",
        expected: "Any Error values are gathered into one list.",
        code: lessonCode`
let traverse results =
    let oks = [
        for result in results do
            match result with
            | Ok x -> yield x
            | Error _ -> ()
    ]
    let errors = [
        for result in results do
            match result with
            | Ok _ -> ()
            | Error x -> yield x
    ]
    match errors with
    | [] -> Ok oks
    | errors -> Error errors

printfn "%A" (traverse [ Ok 1; Error "Bad 1"; Error "Bad 2" ])
`
      },
      {
        title: "JSON Round Trip",
        concept: "System.Text.Json can serialize plain records and deserialize them back.",
        task: "Run it, then add another field to Customer.",
        expected: "The JSON string and the deserialized record agree.",
        code: lessonCode`
open System.Text.Json

type Customer = { Name: string; Balance: decimal }

let customer = { Name = "Isaac"; Balance = 123.45m }
let json = JsonSerializer.Serialize customer
let copy = JsonSerializer.Deserialize<Customer> json

printfn "%s" json
printfn "%A" copy
`
      }
    ]
  },
  {
    id: "11",
    number: "10",
    title: "Interop and Packages",
    files: ["11/1-ConsumingCSharp.fsx", "11/WorkingWithNuget", "11/WorkingWithFable", "11/MixedCodeApp"],
    summary: "Understand where F# talks to C#, NuGet, and JavaScript tooling, then practice the interop patterns locally.",
    steps: [
      {
        title: "Call .NET APIs",
        concept: "F# calls ordinary .NET classes and static members directly.",
        task: "Run it, then change the URI.",
        expected: "The System.Uri object is created and its host is printed.",
        code: lessonCode`
let website = System.Uri "https://fsharp.org/learn"

printfn "Host: %s" website.Host
printfn "Path: %s" website.AbsolutePath
`
      },
      {
        title: "Object Construction",
        concept: "Named arguments make .NET object construction readable from F#.",
        task: "Run it, then change the StringBuilder capacity.",
        expected: "The mutable .NET object is still usable, even in functional code.",
        code: lessonCode`
open System.Text

let builder = StringBuilder(capacity = 64)
builder.Append("F#") |> ignore
builder.Append(" works with .NET") |> ignore

printfn "%s" (builder.ToString())
`
      },
      {
        title: "Adapter Function",
        concept: "Wrap object-oriented APIs in small functions so the rest of the code stays pipeline-friendly.",
        task: "Run it, then add Uri.Scheme to the output.",
        expected: "The pipeline consumes a normal F# function.",
        code: lessonCode`
let hostOf (url: string) =
    let uri = System.Uri url
    uri.Host

[ "https://fsharp.org"; "https://dotnet.microsoft.com" ]
|> List.map hostOf
|> printfn "%A"
`
      }
    ]
  },
  {
    id: "12",
    number: "11",
    title: "Tasks and Async",
    files: ["12/Sample12.fsx", "12/file1.txt", "12/file2.txt", "12/file3.txt"],
    summary: "Consume Task-returning APIs, write task blocks, and compose async file-style workflows.",
    steps: [
      {
        title: "Task Basics",
        concept: "A Task represents work that may complete later. Await with let! inside a task block.",
        task: "Run it, then change the delay.",
        expected: "The task returns a string after asynchronous work completes.",
        code: lessonCode`
open System.Threading.Tasks

let greetLater name = task {
    do! Task.Delay 100
    return $"Hello, {name}"
}

let result = greetLater "Isaac"
printfn "%s" result.Result
`
      },
      {
        title: "Compose File Reads",
        concept: "Async composition is just another expression: bind values, then return a combined result.",
        task: "Run it, then add a third pretend file.",
        expected: "The task combines values in order.",
        code: lessonCode`
open System.Threading.Tasks

let readTextAsync name = task {
    do! Task.Delay 50
    return $"{name}=loaded"
}

let combined = task {
    let! first = readTextAsync "file1.txt"
    let! second = readTextAsync "file2.txt"
    return $"{first}; {second}"
}

printfn "%s" combined.Result
`
      },
      {
        title: "Result in Task",
        concept: "Async work can still return Result so failures remain explicit.",
        task: "Run it, then make the balance positive.",
        expected: "The result is Error for a customer in debt.",
        code: lessonCode`
let loadCustomerFromDbAsync customerId = task {
    return {| Name = "Isaac"; Balance = 0 |}
}

let tryGetCustomerAsync customerId = task {
    let! customer = loadCustomerFromDbAsync customerId
    return
        if customer.Balance <= 0 then Error "Customer is in debt"
        else Ok customer
}

printfn "%A" ((tryGetCustomerAsync 1).Result)
`
      }
    ]
  },
  {
    id: "13",
    number: "12",
    title: "Web App Shape",
    files: ["13/MyGiraffeApp"],
    summary: "The sample app uses Giraffe, but the atomic lessons focus on request handling shape without package setup.",
    steps: [
      {
        title: "Request to Response",
        concept: "A handler can be modeled as a function from request data to response data.",
        task: "Run it, then change the route.",
        expected: "The function returns a response record.",
        code: lessonCode`
type Request = { Path: string; User: string option }
type Response = { StatusCode: int; Body: string }

let handle request =
    match request.Path, request.User with
    | "/hello", Some user -> { StatusCode = 200; Body = $"Hello, {user}" }
    | "/hello", None -> { StatusCode = 401; Body = "Sign in first" }
    | _ -> { StatusCode = 404; Body = "Not found" }

printfn "%A" (handle { Path = "/hello"; User = Some "Isaac" })
`
      },
      {
        title: "Route Table",
        concept: "A web framework route table can be represented as matching on method and path.",
        task: "Run it, then add a POST route.",
        expected: "Known routes return OK; unknown routes return Not found.",
        code: lessonCode`
type Method = GET | POST
type Request = { Method: Method; Path: string }

let route request =
    match request.Method, request.Path with
    | GET, "/" -> "Home"
    | GET, "/health" -> "OK"
    | _ -> "Not found"

[ { Method = GET; Path = "/" }; { Method = POST; Path = "/" } ]
|> List.map route
|> printfn "%A"
`
      },
      {
        title: "Validate Input",
        concept: "Use Result before reaching the handler's core business behavior.",
        task: "Run it, then try an empty name.",
        expected: "The response maps validation errors into a client-facing status.",
        code: lessonCode`
type Response = { StatusCode: int; Body: string }

let validateName name =
    if System.String.IsNullOrWhiteSpace name then Error "Name is required"
    else Ok name

let greet name =
    match validateName name with
    | Ok validName -> { StatusCode = 200; Body = $"Hello, {validName}" }
    | Error message -> { StatusCode = 400; Body = message }

printfn "%A" (greet "Isaac")
`
      }
    ]
  },
  {
    id: "14",
    number: "13",
    title: "Testing Through Types",
    files: ["14/1-TestingThroughTypes.fsx", "14/BasicTests", "14/ExpectoTests", "14/MyTestsXUnit", "14/5-PropertyBasedTesting.fsx"],
    summary: "Use types to prevent invalid states, then write focused checks for behavior that still needs tests.",
    steps: [
      {
        title: "Private Constructor Pattern",
        concept: "A private single-case union forces callers through a smart constructor.",
        task: "Run it, then pass an invalid email.",
        expected: "Only valid email strings can become ValidatedEmail.",
        code: lessonCode`
type ValidatedEmail =
    private
    | ValidatedEmail of string

    member this.Value =
        match this with
        | ValidatedEmail email -> email

    static member TryCreate(unvalidatedEmail: string) =
        if unvalidatedEmail.Contains "@" then Ok(ValidatedEmail unvalidatedEmail)
        else Error "Invalid email"

let result = ValidatedEmail.TryCreate "isaac@example.com"
printfn "%A" result
`
      },
      {
        title: "Tiny Assert",
        concept: "A test is a repeatable check with a clear expected value.",
        task: "Run it, then break the expected value to see the failure.",
        expected: "The script prints passed when the behavior matches.",
        code: lessonCode`
let assertEqual expected actual =
    if expected <> actual then
        failwith $"Expected {expected}, got {actual}"

let add a b = a + b

assertEqual 7 (add 3 4)
printfn "passed"
`
      },
      {
        title: "Property-Like Check",
        concept: "Property-based thinking checks behavior over many inputs, not one example.",
        task: "Run it, then change the property so it fails.",
        expected: "All generated inputs preserve the property.",
        code: lessonCode`
let reverseTwiceIsOriginal values =
    values |> List.rev |> List.rev = values

let samples = [
    []
    [ 1 ]
    [ 1; 2; 3 ]
    [ -10; 0; 10 ]
]

samples
|> List.iter (fun sample ->
    if not (reverseTwiceIsOriginal sample) then
        failwith $"Property failed for {sample}")

printfn "checked %d samples" samples.Length
`
      }
    ]
  }
];
