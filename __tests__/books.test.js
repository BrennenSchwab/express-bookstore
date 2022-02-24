process.env.NODE_ENV = "test"

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url, author, language, pages, publisher, title, year)
      VALUES(
        '0691161518',
        'http://a.co/eobPtX2',
        'Matthew Lane',
        'english',
        264,
        'Princeton University Press',
        'Power-Up: Unlocking the Hidden Mathematics in Video Games',
        2017)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});


describe("POST /books", function () {
  test("Creates a new book", async function () {
    const response = await request(app)
        .post(`/books`)
        .send({
          isbn: '12233445',
          amazon_url: "https://a.co/booknew",
          author: "Brennen",
          language: "english",
          pages: 500,
          publisher: "None",
          title: "Book Test",
          year: 2022
        });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Prevents creating book without required title", async function () {
    const response = await request(app)
        .post(`/books`)
        .send({year: 2022});
    expect(response.statusCode).toBe(400);
  });
});


describe("GET /books", function () {
  test("Gets a list of 1 book", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
  });
});


describe("GET /books/:isbn", function () {
  test("Gets a single book", async function () {
    const response = await request(app)
        .get(`/books/${book_isbn}`)
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(book_isbn);
  });

  test("Responds with 404 if can't find book in question", async function () {
    const response = await request(app)
        .get(`/books/1242`)
    expect(response.statusCode).toBe(404);
  });
});


describe("PUT /books/:id", function () {
  test("Updates a single book", async function () {
    const response = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
            isbn: '12233445',
            amazon_url: "https://a.co/booknew",
            author: "Brennen",
            language: "english",
            pages: 500,
            publisher: "Still None",
            title: "Updated Book",
            year: 2022
        });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.publisher).toBe("Still None");
    expect(response.body.book.title).toBe("Updated Book");
  });

  test("Prevents a bad book update", async function () {
    const response = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
            amazon_url: "https://a.co/booknew",
            author: "Brennen",
            language: "english",
            pages: 500,
            publisher: "Still None",
            extra: "error",
            title: "Updated Book",
            year: 2022
        });
    expect(response.statusCode).toBe(400);
  });

  test("Responds 404 if can't find book in question", async function () {
    // delete book first
    await request(app)
        .delete(`/books/${book_isbn}`)
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /books/:id", function () {
  test("Deletes a single a book", async function () {
    const response = await request(app)
        .delete(`/books/${book_isbn}`)
    expect(response.body).toEqual({message: "Book deleted"});
  });
});


afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});


afterAll(async function () {
  await db.end()
});