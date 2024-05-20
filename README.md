

# Holiday.com

Welcome to the Holiday.com! This application allows users to search for hotels, make bookings, and payments. Hotels and vendors can also list their rooms for rent.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Live Demo](#live-demo)
- [License](#license)

## Description

The Hotel Booking Web App is a full-stack web application built using React TypeScript for the frontend and Express.js with Node.js for the backend. It utilizes MongoDB with Mongoose for database management. The app provides functionalities for user authentication, hotel search, booking, and payment processing.

## Features

- User Authentication: Users can register and login to their accounts.
- Hotel Search: Users can search for hotels based on various criteria.
- Booking Management: Users can make bookings for selected hotels.
- Payment Processing: Stripe integration for secure payment transactions.
- Hotel/Vendor Listing: Hotels and vendors can list their rooms for rent.

## Technologies Used

- **Frontend:**
  - React TypeScript
  - Tailwind CSS
  - React Router

- **Backend:**
  - Express.js
  - Node.js
  - MongoDB with Mongoose
  - Bcrypt (for password hashing)
  - Multer (for handling multipart/form-data)

- **Services:**
  - Cloudinary (for image storage)
  - Stripe (for payment processing)

- **Testing:**
  - Playwright

## Installation

1. Clone the repository.
2. Navigate to the project directory.
3. Install dependencies using `npm install`.
4. Set up environment variables for configuration.
5. Run the development server using `npm start`.

## Usage

1. Register or login to your account.
2. Search for hotels based on location, date, and other criteria.
3. Select a hotel and make a booking.
4. Complete the payment process securely using Stripe.

## Testing

You can run tests using Playwright. Ensure that you have configured test environments and dependencies properly before running tests.


## Live Demo

Check out the live demo of the Hotel Booking Web App [here](https://holiday-c8zb.onrender.com/).

## License

This project is licensed under the [MIT License](LICENSE).

