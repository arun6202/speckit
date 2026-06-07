import pypdf
import re
import json
import sys
import os

# Ensure UTF-8 output encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Define PDF page ranges for each lesson
LESSONS_INFO = [
    {
        "id": "lesson4",
        "unit": "Unit 2: Hello F#",
        "number": 4,
        "title": "Saying a little, doing a lot",
        "start_page": 63,
        "end_page": 73,
        "summary": "Learn about the core syntax of F#, let bindings, values, scoping, and how they differ from C#."
    },
    {
        "id": "lesson5",
        "unit": "Unit 2: Hello F#",
        "number": 5,
        "title": "Trusting the compiler",
        "start_page": 74,
        "end_page": 85,
        "summary": "Understand F# type inference, how it differs from C# var, type signatures, and explicit type annotations."
    },
    {
        "id": "lesson6",
        "unit": "Unit 2: Hello F#",
        "number": 6,
        "title": "Working with immutable data",
        "start_page": 86,
        "end_page": 96,
        "summary": "Explore immutability by default, how to explicitly declare mutable bindings, and modeling state transitions."
    },
    {
        "id": "lesson7",
        "unit": "Unit 2: Hello F#",
        "number": 7,
        "title": "Expressions and statements",
        "start_page": 97,
        "end_page": 107,
        "summary": "Contrast statements and expressions, and see how F# treats almost everything as an expression that returns a value."
    },
    {
        "id": "lesson9",
        "unit": "Unit 3: Types and functions",
        "number": 9,
        "title": "Shaping data with tuples",
        "start_page": 117,
        "end_page": 126,
        "summary": "Learn to group anonymous values together using tuples, match patterns on tuples, and understand tuple types."
    },
    {
        "id": "lesson10",
        "unit": "Unit 3: Types and functions",
        "number": 10,
        "title": "Shaping data with records",
        "start_page": 127,
        "end_page": 140,
        "summary": "Explore F# records, POCOs done right, cloning records with the 'with' keyword, and record type inference."
    },
    {
        "id": "lesson11",
        "unit": "Unit 3: Types and functions",
        "number": 11,
        "title": "Building composable functions",
        "start_page": 141,
        "end_page": 153,
        "summary": "Master partial function application (currying), function composition operators, and pipelines."
    },
    {
        "id": "lesson12",
        "unit": "Unit 3: Types and functions",
        "number": 12,
        "title": "Organizing code without classes",
        "start_page": 154,
        "end_page": 164,
        "summary": "Use modules and namespaces to organize F# projects without resorting to object-oriented classes."
    },
    {
        "id": "lesson13",
        "unit": "Unit 3: Types and functions",
        "number": 13,
        "title": "Achieving code reuse in F#",
        "start_page": 165,
        "end_page": 175,
        "summary": "Implement higher-order functions, pass functions as arguments, and inject dependencies as functions."
    },
    {
        "id": "lesson15",
        "unit": "Unit 4: Collections in F#",
        "number": 15,
        "title": "Working with collections in F#",
        "start_page": 189,
        "end_page": 201,
        "summary": "Get introduced to F# collection types: Lists, Arrays, and Sequences, and understand their trade-offs."
    },
    {
        "id": "lesson16",
        "unit": "Unit 4: Collections in F#",
        "number": 16,
        "title": "Useful collection functions",
        "start_page": 202,
        "end_page": 212,
        "summary": "Discover fundamental functions for collections like map, filter, iter, and find."
    },
    {
        "id": "lesson17",
        "unit": "Unit 4: Collections in F#",
        "number": 17,
        "title": "Maps, dictionaries, and sets",
        "start_page": 213,
        "end_page": 221,
        "summary": "Utilize key-value collections (Maps and Dictionaries) and unique lists (Sets) in F#."
    },
    {
        "id": "lesson18",
        "unit": "Unit 4: Collections in F#",
        "number": 18,
        "title": "Folding your way to success",
        "start_page": 222,
        "end_page": 234,
        "summary": "Understand folding (aggregations/accumulators) to perform complex state accumulation over collections."
    },
    {
        "id": "lesson20",
        "unit": "Unit 5: The F# type system",
        "number": 20,
        "title": "Program flow in F#",
        "start_page": 249,
        "end_page": 260,
        "summary": "Write loops, branching logic, and use powerful pattern matching syntax in F#."
    },
    {
        "id": "lesson21",
        "unit": "Unit 5: The F# type system",
        "number": 21,
        "title": "Modeling relationships in F#",
        "start_page": 261,
        "end_page": 273,
        "summary": "Model domain relationships using Discriminated Unions (DUs) and structural composition."
    },
    {
        "id": "lesson22",
        "unit": "Unit 5: The F# type system",
        "number": 22,
        "title": "Fixing the billion-dollar mistake",
        "start_page": 274,
        "end_page": 286,
        "summary": "Handle missing values using F# Option types (Some/None) instead of null references."
    },
    {
        "id": "lesson23",
        "unit": "Unit 5: The F# type system",
        "number": 23,
        "title": "Business rules as code",
        "start_page": 287,
        "end_page": 297,
        "summary": "Encode complex business constraints using F# marker types and the Result type (Ok/Error)."
    }
]

# Curated comparative C# translations and explanations for F# listings
COMPARATIVE_DATA = {
    "4.1": {
        "csharp": """// C# equivalent code
int age = 35;
System.Uri website = new System.Uri("http://fsharp.org");
int Add(int first, int second) => first + second;""",
        "shift": "• F# let bindings are immutable (readonly) by default.\n• The compiler infers types automatically; no explicit `int` or `Uri` declarations are needed.\n• Instantiating objects doesn't require the `new` keyword (optional in F#)."
    },
    "4.2": {
        "csharp": """// C# equivalent code (representing variable reuse)
int Foo() {
    int x = 10;
    x = x + 1; // Mutation of existing memory
    return x;
}""",
        "shift": "• F# does NOT mutate the variable here. It performs 'Shadowing'.\n• Shadowing declares a brand new value with the same name, leaving the old one intact in memory.\n• This is a safe way to reuse names without introducing mutable state."
    },
    "4.4": {
        "csharp": """// C# equivalent code
using System;

public static int DoStuffWithTwoNumbers(int first, int second)
{
    int added = first + second;
    Console.WriteLine("{0} + {1} = {2}", first, second, added);
    int doubled = added * 2;
    return doubled;
}""",
        "shift": "• F# uses indentation (off-side rule) for scopes, replacing C# curly braces `{ }`.\n• F# functions automatically return the result of the last expression; the `return` keyword is omitted."
    },
    "4.6": {
        "csharp": """// C# equivalent code (nested scope via blocks)
string GetEstimatedAge() {
    int age;
    {
        int year = DateTime.Now.Year;
        age = year - 1979;
    }
    return $"You are about {age} years old!";
}""",
        "shift": "• In F#, you can nest scopes inside variables directly using indented blocks.\n• Values defined inside a nested block (like `year`) are invisible to the outer block."
    },
    "5.6": {
        "csharp": """// C# equivalent code
int Add(int a, int b) {
    return a + b;
}""",
        "shift": "• In F#, you don't declare return types. The compiler computes it automatically based on inputs.\n• Under the hood, F# compiles this to exactly the same static IL method as C#."
    },
    "6.2": {
        "csharp": """// C# equivalent code
int count = 0;
count = count + 1; // Mutation is default""",
        "shift": "• In F#, variables must be explicitly marked with the `mutable` keyword to change their value.\n• Mutation uses the `<-` operator rather than `=`, which is reserved strictly for binding."
    },
    "7.1": {
        "csharp": """// C# statement-based branching
string result;
if (DateTime.Now.DayOfWeek == DayOfWeek.Friday) {
    result = "Yay!";
} else {
    result = "Nay";
}""",
        "shift": "• In C#, `if` is a statement (doesn't return a value). In F#, `if` is an expression (returns a value).\n• F# expressions can be assigned directly to variables, eliminating temporary mutables."
    },
    "9.1": {
        "csharp": """// C# equivalent: System.ValueTuple
(string, int) person = ("John", 30);
var name = person.Item1;
var age = person.Item2;""",
        "shift": "• Tuples are a first-class syntax in F# separated by commas: `(\"John\", 30)`.\n• You can destruct them instantly: `let name, age = person`."
    },
    "10.1": {
        "csharp": """// C# record class (newer versions) or immutable class
public record Customer(string Name, int Age, string Email);""",
        "shift": "• F# records provide lightweight immutable data containers with structural equality by default.\n• Structural equality means records with the same field values are equal (`A = B` is true)."
    },
    "10.2": {
        "csharp": """// C# with expressions (immutable copy with change)
Customer updated = original with { Email = "new@fsharp.org" };""",
        "shift": "• Non-destructive copy is standard in functional programming.\n• F# uses `with` to create a copy of a record with specific modified fields."
    },
    "11.1": {
        "csharp": """// C# equivalent: Currying delegates
Func<int, Func<int, int>> add = x => y => x + y;
var add5 = add(5);
var result = add5(10); // 15""",
        "shift": "• In F#, all functions are curried by default. This means a function taking 2 arguments is actually a chain of single-argument functions.\n• This lets you apply arguments partially to configure reusable templates: `let add5 = add 5`."
    },
    "15.1": {
        "csharp": """// C# equivalent: ReadOnlyCollection or arrays
int[] arr = new int[] { 1, 2, 3 };
System.Collections.Immutable.ImmutableList<int> list = ...;""",
        "shift": "• F# Lists (`[1; 2; 3]`) are singly-linked lists and immutable.\n• F# Arrays (`[|1; 2; 3|]`) are standard mutable .NET arrays.\n• Sequences (`seq { 1..3 }`) are lazy evaluation pipelines equivalent to C# `IEnumerable`."
    },
    "16.1": {
        "csharp": """// C# LINQ equivalent
var results = items.Select(x => x * 2).Where(x => x > 10);""",
        "shift": "• F# uses module functions (e.g. `List.map`, `List.filter`) rather than LINQ extension methods.\n• Code flows naturally left-to-right using the pipe operator `|>`."
    },
    "20.3": {
        "csharp": """// C# modern switch statement (pattern matching)
var result = shape switch {
    Circle c => c.Radius * c.Radius * Math.PI,
    Rectangle r => r.Length * r.Width,
    _ => throw new Exception("Unknown shape")
};""",
        "shift": "• Pattern matching (`match ... with`) is F#'s control flow superpower.\n• Unlike C#, F# checks for completeness: the compiler warns you if you miss a case!"
    },
    "21.2": {
        "csharp": """// C# equivalent representation (Inheritance hierarchy)
public abstract class Shape {}
public class Circle : Shape { public double Radius { get; } }
public class Rectangle : Shape { public double Width { get; }; public double Height { get; } }""",
        "shift": "• Discriminated Unions (DUs) model data that can be one of several cases (sum types).\n• They replace object-oriented inheritance hierarchies with clean, compile-time checked cases."
    },
    "22.1": {
        "csharp": """// C# nullable references (null safety check)
string? name = GetName();
int length = name != null ? name.Length : 0;""",
        "shift": "• F# resolves the 'billion-dollar mistake' by eliminating standard `null` references for F# types.\n• Missing data is modeled explicitly with the `Option` union: `Some(value)` or `None`."
    }
}

# Curated practice exercises for core lessons
EXERCISES_DATA = {
    "lesson4": {
        "prompt": "Practice let bindings & scoping. Write a function `calculateSquare` that takes an integer `x` and returns its square `x * x`. Use `printfn` to print the result of squaring 12.",
        "starter": """// Lesson 4 Exercise
// Write your calculateSquare function here:
let calculateSquare x =
    // TODO: multiply x by itself
    0

// Call your function with 12 and print it:
let result = calculateSquare 12
printfn "Square Result: %d" result
""",
        "expected": "Square Result: 144"
    },
    "lesson5": {
        "prompt": "Practice type inference. Write a function `makeGreeting` that takes a string `name` and returns a string in the format 'Greetings, [name]!'. Do NOT add type annotations. Print the greeting for 'Sarah'.",
        "starter": """// Lesson 5 Exercise
// Write makeGreeting without type annotations:
let makeGreeting name =
    "" // TODO: use sprintf or concatenation

// Greet Sarah and print the result:
let msg = makeGreeting "Sarah"
printfn "Greet: %s" msg
""",
        "expected": "Greet: Greetings, Sarah!"
    },
    "lesson6": {
        "prompt": "Practice explicit mutability. Define a mutable variable named `score` initialized to 100. Modify its value to 150 using the mutation operator (`<-`), and then print its final value.",
        "starter": """// Lesson 6 Exercise
// 1. Declare mutable score initialized to 100:


// 2. Mutate score to be 150:


// 3. Print the score in the format "Score: [value]" using printfn:

""",
        "expected": "Score: 150"
    },
    "lesson7": {
        "prompt": "Practice Expressions. Write an `if` expression that checks if a variable `temperature` (set to 32) is greater than 30. If yes, return the string 'Hot'; otherwise return 'Cold'. Bind the result of this expression to `status` and print it.",
        "starter": """// Lesson 7 Exercise
let temperature = 32

// Write an expression-based if-else to bind to 'status':
let status = 
    // TODO: if temperature > 30 then "Hot" else "Cold"
    ""

printfn "Weather: %s" status
""",
        "expected": "Weather: Hot"
    },
    "lesson9": {
        "prompt": "Practice Tuples. Write a function `getPersonInfo` that returns a tuple containing a name (string) and age (int). Define it to return ('Dave', 45). In your main script, unpack this tuple and print 'Name: [name], Age: [age]'.",
        "starter": """// Lesson 9 Exercise
// Write getPersonInfo returning a tuple:
let getPersonInfo() =
    // TODO: return tuple
    ("", 0)

// Unpack and print:
let name, age = getPersonInfo()
printfn "Name: %s, Age: %d" name age
""",
        "expected": "Name: Dave, Age: 45"
    },
    "lesson10": {
        "prompt": "Practice Records. Define a record type named `Car` with fields `Make: string` and `Year: int`. Create an instance of this car with Make='Ford' and Year=2018. Then, create a copy of this car with Year updated to 2022 using the 'with' keyword, and print its details.",
        "starter": """// Lesson 10 Exercise
// 1. Define Car record type:
type Car = {
    Make: string
    Year: int
}

// 2. Create initial car instance:
let car1 = { Make = "Ford"; Year = 2018 }

// 3. Create updated car with Year = 2022:
let car2 = 
    // TODO: use copy-with
    car1

printfn "Car details: %s %d" car2.Make car2.Year
""",
        "expected": "Car details: Ford 2022"
    },
    "lesson11": {
        "prompt": "Practice Currying & Pipelines. Write a function `multiply` that takes two integers `x` and `y` and multiplies them. Create a partially applied function `triple` that multiplies any input by 3. Then, use the pipe operator `|>` to pass the number 10 into `triple`, and print the result.",
        "starter": """// Lesson 11 Exercise
// 1. Define multiply function:
let multiply x y = x * y

// 2. Create partially applied 'triple':
let triple = multiply 3

// 3. Pipe 10 into triple and print:
let result = 
    // TODO: pipe 10 to triple
    0

printfn "Pipeline Result: %d" result
""",
        "expected": "Pipeline Result: 30"
    },
    "lesson16": {
        "prompt": "Practice Collection functions. Given a list of numbers from 1 to 5, use `List.filter` to keep only the even numbers, and then use `List.map` to square those numbers. Print the resulting list (F# lists print using '%A').",
        "starter": """// Lesson 16 Exercise
let numbers = [1; 2; 3; 4; 5]

// Filter even numbers (x % 2 = 0) and square them:
let processed = 
    // TODO: use List.filter and List.map
    numbers

printfn "Processed: %A" processed
""",
        "expected": "Processed: [4; 16]"
    },
    "lesson21": {
        "prompt": "Practice Discriminated Unions. Define a DU named `Answer` with cases `Yes`, `No`, and `Maybe`. Write a function `answerText` that pattern matches on `Answer` and returns 'Approved' for Yes, 'Rejected' for No, and 'Pending' for Maybe. Test it by printing the text for `Yes`.",
        "starter": """// Lesson 21 Exercise
// 1. Define Answer DU:
type Answer = 
    | Yes
    | No
    | Maybe

// 2. Write answerText matching on Answer:
let answerText answer =
    match answer with
    // TODO: fill matches
    | _ -> "Unknown"

printfn "Status: %s" (answerText Yes)
""",
        "expected": "Status: Approved"
    },
    "lesson22": {
        "prompt": "Practice Option type. Write a function `findSafeDiv` that takes a numerator `x` and denominator `y`. If `y` is 0, return `None`; otherwise return `Some(x / y)`. Print the result of dividing 10 by 2, and then 10 by 0 using '%A'.",
        "starter": """// Lesson 22 Exercise
// Write findSafeDiv returning Option:
let findSafeDiv x y =
    if y = 0 then None
    else Some(x / y)

// Print division runs:
printfn "Run 1: %A" (findSafeDiv 10 2)
printfn "Run 2: %A" (findSafeDiv 10 0)
""",
        "expected": "Run 1: Some 5\nRun 2: <null>\n"
    }
}

# Code line classification rules
START_INDICATORS = [
    'let ', 'open ', 'type ', 'member ', 'override ', 'module ', 'printfn ', 'sprintf ', 
    '//', '(*', '[<', 'namespace ', 'using ', 'class ', 'public ', 'private ', 'open System'
]

CONTINUE_INDICATORS = START_INDICATORS + [
    'with ', 'rec ', 'mutable ', 'use ', 'match ', '->', '::', ';;', '|>', '<|', '<-', 
    '{', '}', ';', 'then ', 'else ', 'elif ', 'for ', 'in ', 'to ', 'while ', 'yield ', 'return ', 'and '
]

def is_code_line(line, in_block):
    line_strip = line.strip()
    if not line_strip:
        return False
        
    indicators = CONTINUE_INDICATORS if in_block else START_INDICATORS
    
    # Check if starts with any of the indicators
    starts_with_ind = False
    matched_ind = ""
    for ind in indicators:
        if line_strip.startswith(ind):
            starts_with_ind = True
            matched_ind = ind
            break
            
    if starts_with_ind:
        # Enforce strict rules for let and member to avoid prose
        if matched_ind in ['let ', 'member ', 'override ']:
            # Must contain '=' or '(' or ')' to look like a binding
            if '=' not in line_strip and '(' not in line_strip:
                return False
        return True
        
    # Check operators
    if in_block and any(op in line_strip for op in ['->', '::', ';;', '|>', '<|', '<-', '=']):
        return True
        
    # Indented lines that look like code and we are already in a block
    if in_block and (line.startswith('  ') or line.startswith('\t')):
        # Avoid prose lines
        if re.match(r'^[A-Z]', line_strip) and (line_strip.endswith('.') or line_strip.endswith(',')) and len(line_strip.split()) > 5:
            return False
        return True
        
    return False

def clean_code(code_str):
    # Standard cleanup for code snippets to remove PDF page numbers, headers that bleed in, etc.
    lines = code_str.split('\n')
    cleaned = []
    for line in lines:
        line_strip = line.strip()
        # Skip empty lines or header artifacts
        if re.match(r'^\d+\s+Lesson\s+\d+', line_strip) or re.match(r'^Lesson\s+\d+\s+.*?\s+\d+$', line_strip):
            continue
        if re.match(r'^[A-Za-z\s]+\s+\d+$', line_strip) or re.match(r'^\d+\s+[A-Za-z\s]+$', line_strip):
            continue
        if "Licensed to" in line:
            continue
        cleaned.append(line)
    return "\n".join(cleaned)

def reconstruct_paragraphs(prose_lines):
    """
    SOTA Paragraph Reconstitutor:
    - Merges end-of-line hyphenated words (e.g. 'com-' + 'piler' -> 'compiler').
    - Joins chopped-up lines that form continuous sentences.
    - Maintains list structures (lines starting with '' or bullet points).
    """
    paragraphs = []
    current_para = []
    
    i = 0
    lines_len = len(prose_lines)
    while i < lines_len:
        line = prose_lines[i].strip()
        if not line:
            if current_para:
                paragraphs.append(" ".join(current_para))
                current_para = []
            i += 1
            continue
            
        # Lists indicator check
        if line.startswith('') or line.startswith('•') or line.startswith('*') or line.startswith('-') or re.match(r'^\d+\s', line):
            if current_para:
                paragraphs.append(" ".join(current_para))
                current_para = []
            paragraphs.append(line)
            i += 1
            continue
            
        # End of line hyphenation check
        if line.endswith('-'):
            line_no_hyphen = line[:-1]
            if i + 1 < lines_len:
                next_line = prose_lines[i+1].strip()
                if next_line:
                    next_parts = next_line.split(None, 1)
                    if next_parts:
                        first_word = next_parts[0]
                        rest = next_parts[1] if len(next_parts) > 1 else ""
                        # Reconnect word
                        merged_word = line_no_hyphen + first_word
                        line = merged_word + (" " + rest if rest else "")
                        prose_lines[i+1] = "" # consume next line's first part (rest will be processed next)
        
        # Accumulate
        if line:
            current_para.append(line)
        i += 1
        
    if current_para:
        paragraphs.append(" ".join(current_para))
        
    return paragraphs

def extract_pdf_data(pdf_path):
    print(f"Opening PDF file: {pdf_path}")
    reader = pypdf.PdfReader(pdf_path)
    
    extracted_lessons = []
    
    listing_pattern = re.compile(r"Listing\s+(\d+\.\d+)\s*(.*)", re.IGNORECASE)
    
    for info in LESSONS_INFO:
        lesson_id = info["id"]
        start_page = info["start_page"]
        end_page = info["end_page"]
        title = info["title"]
        unit = info["unit"]
        number = info["number"]
        summary = info["summary"]
        
        print(f"Processing Lesson {number}: {title} (pages {start_page} to {end_page})...")
        
        raw_prose_lines = []
        listings = []
        
        # Iterate page by page
        for p_idx in range(start_page, end_page + 1):
            if p_idx >= len(reader.pages):
                break
            page = reader.pages[p_idx]
            page_text = page.extract_text()
            
            # Clean lines of page
            lines = page_text.split('\n')
            page_body_lines = []
            page_listings = []
            
            for line in lines:
                line_strip = line.strip()
                # Remove header/footer line artifacts
                if re.match(r'^\d+\s+Lesson\s+\d+', line_strip) or re.match(r'^Lesson\s+\d+\s+.*?\s+\d+$', line_strip):
                    continue
                if re.match(r'^[A-Za-z\s]+\s+\d+$', line_strip) or re.match(r'^\d+\s+[A-Za-z\s]+$', line_strip):
                    continue
                if "Licensed to" in line:
                    continue
                
                # Check if it's a listing title
                match = listing_pattern.match(line_strip)
                if match:
                    page_listings.append({
                        "number": match.group(1),
                        "title": match.group(2).strip(),
                        "code": "",
                        "csharp_code": "",
                        "shift": ""
                    })
                else:
                    page_body_lines.append(line)
            
            # Parse code blocks on the page
            code_blocks = []
            in_block = False
            current_block = []
            
            for line in page_body_lines:
                if is_code_line(line, in_block):
                    in_block = True
                    current_block.append(line)
                else:
                    if in_block:
                        if current_block:
                            code_blocks.append("\n".join(current_block))
                        current_block = []
                        in_block = False
                    
                    # Accumulate raw prose lines
                    if line.strip():
                        raw_prose_lines.append(line)
                        
            if in_block and current_block:
                code_blocks.append("\n".join(current_block))
                
            # Pair listings with code blocks on this page
            if page_listings:
                for i, lst in enumerate(page_listings):
                    if i < len(code_blocks):
                        lst["code"] = clean_code(code_blocks[i])
                        num_key = lst["number"]
                        if num_key in COMPARATIVE_DATA:
                            lst["csharp_code"] = COMPARATIVE_DATA[num_key]["csharp"]
                            lst["shift"] = COMPARATIVE_DATA[num_key]["shift"]
                    listings.append(lst)
            else:
                # Save any inline code snippets if they are long enough
                for cb in code_blocks:
                    cleaned_cb = clean_code(cb)
                    if len(cleaned_cb.split('\n')) > 2:
                        listings.append({
                            "number": f"{number}.inline",
                            "title": f"Code Snippet",
                            "code": cleaned_cb,
                            "csharp_code": "",
                            "shift": ""
                        })
                        
        # SOTA paragraph reconstruction
        reconstructed_paras = reconstruct_paragraphs(raw_prose_lines)
        
        # Clean listings: remove listings with empty or short invalid code
        valid_listings = []
        for lst in listings:
            if lst["code"] and len(lst["code"].strip()) > 10:
                valid_listings.append(lst)
                
        # Check if we have an exercise for this lesson
        exercise = None
        exercise_key = f"lesson{number}"
        if exercise_key in EXERCISES_DATA:
            exercise = EXERCISES_DATA[exercise_key]
                
        extracted_lessons.append({
            "id": lesson_id,
            "unit": unit,
            "number": number,
            "title": title,
            "summary": summary,
            "paragraphs": reconstructed_paras, # SOTA parsed array of paragraphs
            "listings": valid_listings,
            "exercise": exercise
        })
        
    # Write to lessons.json
    out_path = "lessons.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(extracted_lessons, f, indent=2, ensure_ascii=False)
        
    print(f"SOTA Extraction complete! Saved {len(extracted_lessons)} lessons to {out_path}")

if __name__ == "__main__":
    pdf_file = "e:/Arun/Workspace/fsharp/fsharp.pdf"
    if not os.path.exists(pdf_file):
        print(f"Error: {pdf_file} not found!")
        sys.exit(1)
    extract_pdf_data(pdf_file)
