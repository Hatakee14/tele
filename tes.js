import { Telegraf } from 'telegraf';
import fetch from 'node-fetch';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import Jimp from 'jimp';
import QRCodeReader from 'qrcode-reader';
import dotenv from 'dotenv';
import fs from 'fs';
import img2url from "img-to-url";
import path from 'path';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

async function scanQRCode(filePath) {
    try {
        const image = await Jimp.read(filePath);
        const qr = new QRCodeReader();
        return new Promise((resolve, reject) => {
            qr.decode(image.bitmap, (err, value) => {
                if (err) reject(err);
                else resolve(value?.result);
            });
        });
    } catch (error) {
        console.error('Error scanning QR code:', error);
        throw error;
    }
}

async function matchData(qrData) {
    try {
        const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
        const creds = JSON.parse(process.env.GOOGLE_CREDS);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        return rows.find(row => row.ID === qrData);
    } catch (error) {
        console.error('Error matching data:', error);
        throw error;
    }
}

bot.start((ctx) => ctx.reply('Selamat datang! Silakan kirim foto yang berisi kode QR.'));

bot.help((ctx) => ctx.reply('Kirim foto yang berisi kode QR, dan saya akan memindainya serta mencocokkan datanya.'));

bot.on('photo', async (ctx) => {
    try {
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      
      console.log(`Received photo with file ID: ${fileId}`);
      
      const response = await fetch(fileUrl);
      const buffer = await response.buffer();
      
      const filePath = path.join('foto', `${Date.now()}.png`);
      fs.writeFileSync(filePath, buffer);
      console.log(`Foto disimpan di: ${filePath}`);
      
      const uploadResponse = await img2url.upload(filePath);
      const uploadedUrl = uploadResponse.result.url;
      console.log(`Uploaded URL: ${uploadedUrl}`);
      
      const qrResponse = await fetch(`https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(uploadedUrl)}`);
      const qrData = await qrResponse.json();
      const qrCodeData = qrData[0].symbol[0].data;
     
      console.log(`QR Data: ${qrCodeData}`);
      fetch(`https://script.google.com/macros/s/AKfycbyNrYG0vFtHrsZP7pkEGwA1wgRnEZKpkz1Bc-kbRYirPNsGQ73q-1C9W_J3EVqQi_lU/exec?qrCodeData=${encodeURIComponent(qrCodeData)}`)
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      ctx.reply(`DATA DITEMUKAN\nNama : ${data.matchingRow[1]}\nNIM  :${data.matchingRow[0]}\nWaktu absen ${Date.now()}`);
    } else {
      ctx.reply(`Error: ${data.message}`);
    }
  })
  .catch(error => console.error(error));
      
    } catch (error) {
      console.error(`Error handling photo: ${error}`);
    }
  });

bot.on('text', (ctx) => ctx.reply('Silakan kirim foto yang berisi kode QR.'));

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Bot is running...');