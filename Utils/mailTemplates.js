export function stripHtmlTags(html) {
  return html.replace(/<[^>]*>?/gm, '');
}

export function generateEmailTemplate(title, message, buttonText, buttonLink) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          background-color: #f9f9f9;
          padding: 0;
          margin: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 30px auto;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 30px;
        }
        h2 { color: #333; }
        p { color: #555; font-size: 16px; }
        a.button {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          background-color: #007bff;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        }
        footer {
          margin-top: 30px;
          font-size: 12px;
          color: #aaa;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <h2>${title}</h2>
        <p>${message}</p>
        <a class="button" href="${buttonLink}">${buttonText}</a>
        <p style="margin-top: 20px; font-size: 13px;">
          If the button doesn't work, copy and paste this URL into your browser:
          <br />
          <a href="${buttonLink}" style="color: #007bff;">${buttonLink}</a>
        </p>
        <footer>
          © ${new Date().getFullYear()} SocioFeed. All rights reserved.
        </footer>
      </div>
    </body>
    </html>
  `;
}
