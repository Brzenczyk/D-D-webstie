📅 D&D Session Planner

Web application created to simplify scheduling Dungeons & Dragons sessions by allowing users to vote on available dates.

🔍 Project Overview

The application allows users to add proposed session dates and vote on them. The main goal was to solve a real-life problem of coordinating availability within a group. The system prevents multiple votes from the same user and updates results in real time.

⚙️ Features

Adding new session dates

Voting system for each date

Prevention of multiple votes using cookies

Backend API for handling data

Basic validation of user input

🛠️ Technologies

Frontend:
HTML
CSS
JavaScript (Vanilla JS)

Backend:
Node.js
Express.js

Other:
Cookies (user tracking)
REST API

🧠 What I Learned
Building fullstack applications (frontend + backend)

Managing application state and user interactions

Preventing duplicate actions using cookies

Designing simple API endpoints

Debugging and solving real-world problems

🚀 Live Demo
https://d-d-webstie.onrender.com

💻How to run locally

Clone the repository

In Bash

npm install


⚠️ Environment Configuration

To run the project locally, you need to configure environment variables for email functionality.

Create a .env file in the root directory and add:

PORT=10000

ADMIN_PIN=Your_Pin

MAIL_HOST=Your_Mail_Host_My_Was_Mailtrap

MAIL_PORT=Your_Mail_Port

MAIL_USER=Your_Mail_User

MAIL_PASS=Your_Mail_Password

MAIL_TO=Your_Mail_My_Was_@mailtrap.io

⚠️ For security reasons, sensitive data such as email credentials is not included in the repository.

Again In Bash

node server.js

Then open:

http://localhost:10000
