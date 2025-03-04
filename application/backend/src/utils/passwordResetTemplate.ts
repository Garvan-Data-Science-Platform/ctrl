export function generatePasswordResetEmail(
  resetLink: string,
  firstName: string,
): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #fff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .button {
            display: inline-block;
            background: #007bff;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .button:hover {
            background: #0056b3;
        }
        .footer {
            font-size: 0.8em;
            color: #666;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello ${firstName},</p>
        <p>We received a request to reset your password. If you did not make this request, you can safely ignore this email.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" class="button" target="_blank">Reset Password</a>
        <p>If the button above does not work, copy and paste the following URL into your browser:</p>
        <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
        <p class="footer">If you have any issues, please contact our support team.</p>
    </div>
</body>
</html>
    `

  const text = `Hello ${firstName},\n\nWe received a request to reset your password. If you did not make this request, you can safely ignore this email.\n\nUse the following URL to reset your password:\n${resetLink}\n\nIf you have any issues, please contact our support team.`
  return { html, text }
}
