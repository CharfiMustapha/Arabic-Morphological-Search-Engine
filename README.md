# Arabic Morphological Search Engine

This project is a web-based Arabic morphology system designed to manage Arabic roots, linguistic patterns, and derived words. It allows users to import roots, define morphological schemes, generate words, and validate whether a word is linguistically correct based on predefined rules.

---

## Description

This application provides a structured environment for working with Arabic morphology. It is centered around Arabic roots (جذور) and patterns (أوزان / شِيم), enabling users to generate and analyze derived words.
The system includes multiple interactive interfaces that cover the full workflow of Arabic word processing:
* Managing and importing Arabic roots
* Defining and editing morphological schemes (patterns)
* Generating words from roots and schemes
* Validating whether a word is correct according to morphological rules
The application validates all inputs, removes duplicates, and ensures consistency across the dataset. It also provides detailed feedback for user actions such as import results and validation outputs.

The project is built with a modern frontend (Angular) and communicates with a backend service responsible for processing, validation, and data storage.

---

## Features

### Root Management

* Add Arabic roots manually
* Import roots from .txt files (UTF-8)
* Edit and delete roots
* Automatic validation (minimum length, format checks)
* Duplicate detection and removal
* Import report with success and error tracking

### Schemes (Shams / Morphological Patterns)
* Add and manage morphological patterns
* Edit existing schemes
* Use patterns for word derivation
* Organize schemes for generation rules

### Word Generation
* Generate derived Arabic words from roots and schemes
* Combine patterns with selected roots
* View generated results in real time
* Support multiple generation rules

### Word Validation
* Check if a word is valid according to morphological rules
* Compare words against existing patterns
* Display validation results (valid / invalid)
* Provide feedback on structure correctness

---

## TXT File Format

### Requirements
* Encoding: UTF-8 (mandatory for Arabic support)
* File type: .txt
* Format: one root per line
* Minimum length: 3 characters per root

### Example
```bash
كتب
درس
علم
فعل
حرك
سمع
بصر
قال
ذهب
جاء
```
### Ignored Data

* Empty lines
* Duplicate roots
* Invalid entries (less than 3 characters)
---

## Technologies

* *Frontend*: Angular
* *Backend*: Java-based REST API for morphological processing
* *Data Format*: JSON / TXT input support
* *Encoding*: UTF-8 (for Arabic compatibility)

---

## Usage
1. Root Interface
   * Add or import roots
   * Manage existing entries
2. Schemes Interface
   * Define morphological patterns
   * Edit or update rules
3. Generation Interface
   * Select root + scheme
   * Generate derived words
4. Validation Interface
   * Enter a word
   * Check correctness
   * View validation result
---

## Installation and Execution

### Install Node.js and Next.js

1. Install Node.js (recommended version ≥ 18):

   ```bash
   sudo apt update
   sudo apt install nodejs npm
   
2. Verify the installation:

   ```bash
   node -v
   npm -v
   
3. Install frontend dependencies:

   ```bash
   cd Full_App
   npm install
   

---

### Run the Project

1. Start the frontend (the C backend will start automatically):

   ```bash
   npm run dev
   
2. Open your browser and navigate to:

   
   http://localhost:3000
   

---

## Usage

1. Upload a file or add processes manually.
2. Edit or delete processes as needed.
3. Select the desired scheduling algorithms.
4. Run the simulation.
5. View the scheduling results and the corresponding Gantt chart.

---
