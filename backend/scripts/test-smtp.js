#!/usr/bin/env node
/**
 * SMTP Connection Test Script
 *
 * This script tests your SMTP configuration and helps debug connection issues.
 *
 * Usage:
 *   node scripts/test-smtp.js
 *
 * What it checks:
 *   1. DNS resolution for SMTP host
 *   2. TCP connection to SMTP port
 *   3. SMTP handshake and authentication
 *   4. Sends a test email
 */

const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const net = require('net');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testDNS(host) {
  log(`\n1️⃣  Testing DNS resolution for ${host}...`, colors.blue);
  try {
    const addresses = await dns.resolve4(host);
    log(`✅ DNS resolved to: ${addresses.join(', ')}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ DNS resolution failed: ${error.message}`, colors.red);
    log(`   Possible causes:`, colors.yellow);
    log(`   - Typo in SMTP_HOST (check for "smtppout" vs "smtpout")`, colors.yellow);
    log(`   - DNS server issues`, colors.yellow);
    log(`   - No internet connection`, colors.yellow);
    return false;
  }
}

async function testTCPConnection(host, port) {
  log(`\n2️⃣  Testing TCP connection to ${host}:${port}...`, colors.blue);

  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      log(`❌ Connection timed out after 10 seconds`, colors.red);
      log(`   Possible causes:`, colors.yellow);
      log(`   - Port ${port} is blocked by firewall/ISP`, colors.yellow);
      log(`   - SMTP server is down`, colors.yellow);
      log(`   - Wrong port number`, colors.yellow);
      resolve(false);
    }, 10000);

    socket.connect(port, host, () => {
      clearTimeout(timeout);
      log(`✅ TCP connection successful`, colors.green);
      socket.destroy();
      resolve(true);
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      log(`❌ TCP connection failed: ${error.message}`, colors.red);
      resolve(false);
    });
  });
}

async function testSMTPConnection(host, port, user, pass) {
  log(`\n3️⃣  Testing SMTP authentication...`, colors.blue);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  });

  try {
    await transporter.verify();
    log(`✅ SMTP authentication successful`, colors.green);
    return transporter;
  } catch (error) {
    log(`❌ SMTP authentication failed: ${error.message}`, colors.red);
    log(`   Possible causes:`, colors.yellow);
    log(`   - Wrong username or password`, colors.yellow);
    log(`   - Account locked or suspended`, colors.yellow);
    log(`   - Authentication method not supported`, colors.yellow);
    if (error.message.includes('CERT') || error.message.includes('TLS')) {
      log(`   - Try setting SMTP_TLS_REJECT_UNAUTHORIZED=false for debugging`, colors.yellow);
    }
    return null;
  }
}

async function sendTestEmail(transporter, fromEmail, testEmail) {
  log(`\n4️⃣  Sending test email to ${testEmail}...`, colors.blue);

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: testEmail,
      subject: 'TableSplit SMTP Test ✅',
      html: `
        <h2>SMTP Configuration Test Successful!</h2>
        <p>If you're reading this, your SMTP settings are working correctly.</p>
        <p><strong>Host:</strong> ${process.env.SMTP_HOST}</p>
        <p><strong>Port:</strong> ${process.env.SMTP_PORT}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
    });
    log(`✅ Test email sent successfully!`, colors.green);
    log(`   Message ID: ${info.messageId}`, colors.cyan);
    return true;
  } catch (error) {
    log(`❌ Failed to send email: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('  TableSplit SMTP Configuration Test', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  // Read config
  const host = process.env.SMTP_HOST || 'smtpout.secureserver.net';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `TableSplit <${user}>`;

  log('Configuration:', colors.cyan);
  log(`  Host: ${host}`);
  log(`  Port: ${port} (${port === 465 ? 'SSL' : 'STARTTLS'})`);
  log(`  User: ${user}`);
  log(`  Pass: ${'*'.repeat(pass?.length || 0)}`);
  log(`  From: ${from}`);

  // Validate config
  if (!user || !pass) {
    log('\n❌ Missing SMTP_USER or SMTP_PASS in .env file', colors.red);
    log('   Please configure your .env file first.', colors.yellow);
    process.exit(1);
  }

  // Run tests
  const dnsOk = await testDNS(host);
  if (!dnsOk) {
    log('\n💡 Fix DNS issues before continuing', colors.yellow);
    process.exit(1);
  }

  const tcpOk = await testTCPConnection(host, port);
  if (!tcpOk) {
    log('\n💡 Fix network/firewall issues before continuing', colors.yellow);
    process.exit(1);
  }

  const transporter = await testSMTPConnection(host, port, user, pass);
  if (!transporter) {
    log('\n💡 Fix authentication issues before continuing', colors.yellow);
    process.exit(1);
  }

  // Ask for test email
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question('\nEnter email address to send test email to (or press Enter to skip): ', async (testEmail) => {
    readline.close();

    if (testEmail && testEmail.includes('@')) {
      await sendTestEmail(transporter, from, testEmail);
    } else {
      log('\nSkipping test email send.', colors.yellow);
    }

    log('\n' + '='.repeat(60), colors.cyan);
    log('  Test Complete! 🎉', colors.green);
    log('='.repeat(60) + '\n', colors.cyan);
    process.exit(0);
  });
}

main().catch(console.error);
