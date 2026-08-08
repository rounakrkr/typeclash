import urllib.request
import json
import re
import os

def clean_text(text):
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x00-\x7F]+', '', text) # Keep only basic ASCII
    return text.strip()

texts = []
current_id = 1

def add_text(text, category, source, difficulty):
    global current_id
    text = text.strip()
    if len(text) < 50:
        return
    texts.append({
        "id": current_id,
        "text": text,
        "category": category,
        "source": source,
        "charCount": len(text),
        "difficulty": difficulty
    })
    current_id += 1

# 1. Fetch Quotes (100 quotes)
print("Fetching quotes...")
req = urllib.request.Request('https://dummyjson.com/quotes?limit=100', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        quotes_data = json.loads(response.read().decode())
        for q in quotes_data.get('quotes', []):
            text = clean_text(q['quote'])
            source = q.get('author', 'Unknown')
            diff = 'easy' if len(text) < 100 else ('medium' if len(text) < 200 else 'hard')
            add_text(text, 'quotes', source, diff)
except Exception as e:
    print("Error fetching quotes:", e)

# 2. Fetch Literature (Alice in Wonderland & Pride and Prejudice)
print("Fetching literature...")
def fetch_book(url, title):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            text = response.read().decode('utf-8-sig', errors='ignore')
            # Extract some paragraphs
            paragraphs = re.split(r'\r\n\r\n|\n\n', text)
            count = 0
            for p in paragraphs[100:]: # Skip front matter
                p_clean = clean_text(p)
                if 150 <= len(p_clean) <= 400:
                    diff = 'medium' if len(p_clean) < 250 else 'hard'
                    add_text(p_clean, 'literature', title, diff)
                    count += 1
                if count >= 35: # 35 from each book
                    break
    except Exception as e:
        print("Error fetching book", title, ":", e)

fetch_book('https://www.gutenberg.org/cache/epub/11/pg11.txt', 'Alice in Wonderland')
fetch_book('https://www.gutenberg.org/cache/epub/1342/pg1342.txt', 'Pride and Prejudice')

# 3. Code Snippets
print("Adding code snippets...")
code_snippets = [
    ("function greet(name) { return 'Hello, ' + name + '!'; }", "JS Greeting", "easy"),
    ("const sum = (a, b) => a + b; console.log(sum(5, 10));", "JS Arrow Function", "easy"),
    ("for (let i = 0; i < 10; i++) { console.log(i); }", "JS For Loop", "easy"),
    ("def greet(name):\n    return f'Hello, {name}!'", "Python Greeting", "easy"),
    ("nums = [1, 2, 3, 4, 5]\nsquares = [n**2 for n in nums]", "Python List Comprehension", "medium"),
    ("function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }", "JS Fibonacci", "hard"),
    ("class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        pass", "Python Class", "medium"),
    ("const fetchData = async () => {\n  const response = await fetch('/api/data');\n  const data = await response.json();\n  return data;\n};", "JS Async/Await", "hard"),
    ("import React, { useState } from 'react';\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}", "React Component", "hard"),
    ("def is_prime(n):\n    if n <= 1: return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0: return False\n    return True", "Python Prime Check", "hard"),
    ("document.getElementById('myBtn').addEventListener('click', function() {\n  alert('Button clicked!');\n});", "JS DOM Event", "medium"),
    ("try {\n  const result = riskyOperation();\n  console.log(result);\n} catch (error) {\n  console.error(error);\n}", "JS Try/Catch", "medium"),
    ("let arr = [5, 2, 8, 1, 9];\narr.sort((a, b) => a - b);\nconsole.log(arr);", "JS Array Sort", "medium"),
    ("with open('file.txt', 'r') as f:\n    content = f.read()\n    print(content)", "Python File Read", "medium"),
    ("import os\nfiles = os.listdir('.')\nfor f in files:\n    if f.endswith('.py'):\n        print(f)", "Python OS Module", "medium"),
    ("const person = { name: 'Alice', age: 30, city: 'New York' };\nconst { name, age } = person;", "JS Destructuring", "medium"),
    ("setTimeout(() => {\n  console.log('This runs after 2 seconds');\n}, 2000);", "JS setTimeout", "easy"),
    ("lambda_func = lambda x, y: x * y\nprint(lambda_func(5, 4))", "Python Lambda", "medium"),
    ("const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);", "JS Map", "easy"),
    ("const nums = [1, 2, 3, 4, 5];\nconst evens = nums.filter(n => n % 2 === 0);", "JS Filter", "easy"),
    ("const nums = [1, 2, 3, 4, 5];\nconst sum = nums.reduce((acc, curr) => acc + curr, 0);", "JS Reduce", "medium"),
    ("def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n-1)", "Python Factorial", "medium"),
    ("class Rectangle:\n    def __init__(self, w, h):\n        self.w = w\n        self.h = h\n    def area(self):\n        return self.w * self.h", "Python Class 2", "medium"),
    ("export default function App() {\n  return (\n    <div className='App'>\n      <h1>Hello World</h1>\n    </div>\n  );\n}", "React App", "hard"),
    ("SELECT id, name, email FROM users WHERE age > 18 ORDER BY name ASC;", "SQL Query", "medium"),
    ("UPDATE employees SET salary = salary * 1.10 WHERE department = 'Sales';", "SQL Update", "medium"),
    ("DELETE FROM orders WHERE status = 'cancelled' AND created_at < '2023-01-01';", "SQL Delete", "medium"),
    ("INSERT INTO customers (name, email) VALUES ('John Doe', 'john@example.com');", "SQL Insert", "medium"),
    ("CREATE TABLE users (\n  id INT PRIMARY KEY,\n  name VARCHAR(50),\n  email VARCHAR(100) UNIQUE\n);", "SQL Create Table", "hard"),
    ("app.get('/api/users', (req, res) => {\n  res.json({ users: [{ name: 'Alice' }] });\n});", "Express Route", "hard"),
    ("def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1", "Python Binary Search", "hard")
]

for code, source, diff in code_snippets:
    add_text(code, 'code', source, diff)

# 4. Fetch Tech snippets from Wikipedia
print("Fetching tech snippets...")
tech_titles = "JavaScript|Python|HTML|CSS|Algorithm|Data_structure|Database|SQL|NoSQL|React_(JavaScript_library)|Vue.js|Angular_(web_framework)|Node.js|Express.js|Django_(web_framework)|Flask_(web_framework)|Java_(programming_language)|C_Sharp_(programming_language)|C++|C_(programming_language)|Rust_(programming_language)|Go_(programming_language)|Ruby_(programming_language)|Swift_(programming_language)|Kotlin_(programming_language)|TypeScript|PHP|Object-oriented_programming|Functional_programming|Recursion|API|JSON|XML|Regular_expression|Machine_learning|Artificial_intelligence"
wiki_url = f"https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&titles={tech_titles}"
try:
    req = urllib.request.Request(wiki_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        wiki_data = json.loads(response.read().decode())
        pages = wiki_data['query']['pages']
        for page_id, page_info in pages.items():
            if 'extract' in page_info:
                text = clean_text(page_info['extract'])
                # Split into sentences or smaller chunks if too long
                sentences = text.split('. ')
                chunk = ""
                for sentence in sentences:
                    chunk += sentence + ". "
                    if len(chunk) > 150:
                        diff = 'medium' if len(chunk) < 250 else 'hard'
                        add_text(chunk, 'tech', page_info['title'], diff)
                        chunk = ""
                        break # Just take the first good chunk from each article
except Exception as e:
    print("Error fetching wiki data:", e)

print(f"Generated {len(texts)} texts.")

# Generate the JS file content
js_content = f"// Automatically generated texts data\n"
js_content += f"export const texts = {json.dumps(texts, indent=2)};\n\n"
js_content += """
export function getRandomText(category = null, difficulty = null) {
  let filtered = texts;
  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }
  if (difficulty) {
    filtered = filtered.filter(t => t.difficulty === difficulty);
  }
  if (filtered.length === 0) return texts[Math.floor(Math.random() * texts.length)];
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getTextById(id) {
  return texts.find(t => t.id === id) || null;
}

export function getTextsByCategory(category) {
  return texts.filter(t => t.category === category);
}

export function getTextForDuration(durationSec) {
  let minChars = 0;
  let maxChars = Infinity;
  
  if (durationSec === 15) {
    minChars = 80;
    maxChars = 150;
  } else if (durationSec === 30) {
    minChars = 150;
    maxChars = 250;
  } else if (durationSec === 60) {
    minChars = 250;
    maxChars = 400;
  } else if (durationSec === 120) {
    minChars = 400;
    maxChars = 600;
  }

  const filtered = texts.filter(t => t.charCount >= minChars && t.charCount <= maxChars);
  if (filtered.length === 0) return getRandomText();
  return filtered[Math.floor(Math.random() * filtered.length)];
}
"""

os.makedirs(r'c:\Extra Programs\Files\TypeClash\src\data', exist_ok=True)
with open(r'c:\Extra Programs\Files\TypeClash\src\data\texts.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
print("Saved to c:\\Extra Programs\\Files\\TypeClash\\src\\data\\texts.js")
