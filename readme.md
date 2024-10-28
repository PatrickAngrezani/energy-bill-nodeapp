# Energy Bill Node App

This is a backend application that extracts data from PDF energy bills,  saves it to a Postgres database, and provides a CRUD interface for managing these records. The application is built with Node.js, uses Prisma as the ORM, and stores files in an S3-compatible storage.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Endpoints](#endpoints)
    - [Upload PDF](#upload-pdf)
    - [S3 Download](#s3-download)
- [Testing](#testing)

---

## Features

- Extracts data from a PDF energy bill and parses relevant information.
- Stores parsed information in a PostgreSQL database.
- Uploads extracted PDFs to S3-compatible storage.
- Download files from S3-compatible.
- Allows CRUD operations on energy bills data.
- Uses Prisma as ORM for managing PostgreSQL interactions.

## Technologies Used
- **Node.js** - Server environment
- **Express.js** - Web framework for Node.js
- **Prisma** - ORM for PostgreSQL
- **AWS SDK** - For interacting with AWS S3 and Comprehend
- **Jest** - For unit and integration testing
- **TypeScript** - For static typing
- **PostgreSQL** - Database

## Setup

1. **Clone the repository**:
```bash
git clone https://github.com/PatrickAngrezani/energy-bill-nodeapp
cd energy-bill-nodeapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database: Ensure you have PostgreSQL running locally or remotely, and create a database for the application.

4. Configure Prisma: Generate the Prisma client based on your schema
```bash
npx prisma generate
``` 

5. Run database migrations: Apply the Prisma migrations to set up your database schema.
```bash
npx prisma migrate dev --name init
```

6. Start the server:
```bash
npm run dev
```

### Environment Variables
Create a `.env` file int he root directory and configure the following environment varivles:
```env
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/energy_bills_db"
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_BUCKET_NAME="your-s3-bucket-name"
AWS_REGION="yous-aws-region"
```

- **`PORT`**: Port to run the server (default is `4000`)
- **`DATABASE_URL`**: Connection string for PostgrSQL
- **`AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY`**: Credentials for AWS
- **`AWS_BUCKET_NAME`**: S3 bucket name to upload PDF files
- **`AWS_REGION`**: AWS region of your S3 bucket

## Endpoints

This section provides information on the API endpoints available in this project. You can use these endpoints to upload, download, and manage energy bill data.

### Upload PDF
- **URL:** `/energy-bill/upload-pdf`
- **Method:** `POST`
- **Description:** Uploads a PDF file containing an energy bill. The PDF data is extracted and stored in the database.
- **Request:**
  - Attach a PDF file using form-data with the key `pdf`.
- **Response:** 
  - **Status:** `201 Created` on success
  - **Body:** JSON object with the details of the stored energy bill record.
  - **Example:**
    ```json
    {
      "ucName": "JOSE MESALY FONSECA DE CARVALHO",
      "installationNumber": "3001147735",
      "distributor": "CEMIG",
      "accountNumber": "123456789",
      "month": "SET",
      "year": 2024,
      "totalValue": 150.0,
      "s3Url": "https://fake-s3-url.com/mock.pdf"
    }
    ```

### S3 Download
- **URL:** `/invoice/download?clientNumber=?&month=?&year=?`
- **Method:** `GET`
- **Description:** Downloads the specified PDF file from S3 based on the `id` of the energy bill record.
- **Parameters:**
  - `id`: The unique identifier for the energy bill record in the database.
- **Response:**
  - **Status:** `200 OK` with the PDF file as a binary download.
  - **Status:** `404 Not Found` if the specified `id` does not exist.
- **Example Request:** 
GET /energy-bill/download/1


### CRUD Operations
In addition to uploading and downloading, the following endpoints allow basic CRUD operations for managing energy bill data.

- **Create Energy Bill Record**
- **URL:** `/energy-bill`
- **Method:** `POST`
- **Description:** Create a new energy bill record in the database.

- **Read Energy BillS Record**
- **URL:** `/energy-bills/`
- **Method:** `GET`
- **Description:** Fetch aa energy bills records by.

- **Read Energy Bill Record**
- **URL:** `/energy-bill/:id`
- **Method:** `GET`
- **Description:** Fetch a specific energy bill record by `id`.

- **Update Energy Bill Record**
- **URL:** `/energy-bill/:id`
- **Method:** `PUT`
- **Description:** Update details of an existing energy bill record by `id`.

- **Delete Energy Bill Record**
- **URL:** `/energy-bill/:id`
- **Method:** `DELETE`
- **Description:** Delete an energy bill record from the database by `id`.

Each endpoint requires proper request parameters and headers as per the descriptions. Please refer to each endpoint's specifications above to understand the expected payload and response format.

### Testing
```bash
npm run test
```