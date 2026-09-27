---
title: "Data Structures in C"
slug: data-structures-in-c
summary: "Build the structures every program leans on, from scratch, in plain C11: a growable array and an open addressing hash table, with careful memory handling and measured cost analysis."
level: intermediate
topics: [c, data-structures, memory, hash-tables, dynamic-arrays]
featured: false
position: 2
published_at: 2026-08-20
links:
  - course: algorithm-analysis
    relation: prerequisite
---

> [!NOTE]
> Sample entry. This text is placeholder content that shows how the page looks. Replace it from the admin panel.

Most languages hand you a list and a dictionary and ask you not to look inside. C hands you `malloc` and wishes you luck. That makes it the best language for learning how these structures really work: nothing is hidden, every byte of storage is one you asked for, and every mistake is yours to find.

This course builds two of the most used structures from an empty file. Each lesson develops one complete, compilable program, explains the decisions that are easy to get wrong, and ties the cost of each operation back to the prerequisite course.

You will be able to:

- write a growable array that survives allocation failure without leaking
- implement a hash table with open addressing, resizing and correct deletion
- reason about ownership, invalidated pointers and integer overflow in allocation sizes

## What you need

- Working knowledge of C: pointers, structs, `malloc` and `free`
- A C11 compiler such as GCC or Clang
- The ideas from Algorithm Analysis Essentials, mainly big O and amortized cost

## How to use it

Type the code rather than pasting it, then compile with warnings turned all the way up:

```sh
cc -std=c11 -Wall -Wextra -Wpedantic -fsanitize=address,undefined vector.c -o vector
```

The sanitizers catch out-of-bounds access, use after free and (on Linux) leaks at run time, exactly the class of bug these lessons are about. Every listing in the course builds cleanly with that command.
