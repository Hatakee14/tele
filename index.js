// Import required modules
import { Telegraf, Markup } from 'telegraf';
import fetch from 'node-fetch';

// Initialize bot with your token
const bot = new Telegraf('7991521664:AAFUV0DvVVT1flfkqF-KnC-yxU8u3xfdjSM');

// Object to store user purchase data
const purchaseData = {};

// Main menu options with product codes
const mainMenu = {
  'INSTAGRAM': [
    { name: 'Followers', code: 'ig_flw' },
    { name: 'Likes', code: 'ig_like' },
    { name: 'Views', code: 'ig_view' }
  ],
  'TIKTOK': [
    { name: 'Followers', code: '37450' },
    { name: 'Likes', code: '37389' },
    { name: 'Views', code: '36694' }
  ],
  'SHOPEE': [
    { name: 'Followers', code: '24532' },
    { name: 'Likes', code: 'sp_like' },
    { name: 'Views', code: 'sp_view' }
  ]
};

// Function to create menu buttons
function createMenuButtons(options) {
  return options.map(option => {
    if (typeof option === 'string') {
      return [Markup.button.callback(option, `submenu_${option.toLowerCase()}`)];
    } else {
      return [Markup.button.callback(option.name, `product_${option.code}`)];
    }
  });
}

// Start command handler
bot.command('start', (ctx) => {
  const firstName = ctx.from.first_name || 'kak';
  ctx.replyWithHTML(
    `Halo <b>${firstName}</b>, selamat datang di PangsMedia!`,
    Markup.inlineKeyboard([
      [Markup.button.callback('Menu', 'main_menu')]
    ])
  );
});
// Start command handler
bot.command('cek', (ctx) => {
  ctx.reply(
    `Silahkan kirim id pesanan`
  );
  purchaseData[ctx.from.id] = { step: 'cek' };
});

// Main menu handler
bot.action('main_menu', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(
    'Pilih layanan:',
    Markup.inlineKeyboard(createMenuButtons(Object.keys(mainMenu)))
  );
});

// Submenu handlers
Object.keys(mainMenu).forEach(service => {
  bot.action(`submenu_${service.toLowerCase()}`, (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      `Pilih layanan ${service}:`,
      Markup.inlineKeyboard(createMenuButtons(mainMenu[service]))
    );
  });
});

// Purchase flow handlers
Object.keys(mainMenu).forEach(service => {
  mainMenu[service].forEach(product => {
    bot.action(`product_${product.code}`, (ctx) => {
      ctx.answerCbQuery();
      purchaseData[ctx.from.id] = { 
        service, 
        productName: product.name, 
        productCode: product.code, 
        step: 'tujuan' 
      };
      ctx.reply(`Masukkan tujuan untuk ${service} ${product.name}:`);
    });
  });
});

// Text message handler for purchase flow
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  if (purchaseData[userId]) {
    if (purchaseData[userId].step === 'tujuan') {
      purchaseData[userId].tujuan = ctx.message.text;
      purchaseData[userId].step = 'jumlah';
      ctx.reply('Masukkan jumlah:');
    } else if (purchaseData[userId].step === 'jumlah') {
      purchaseData[userId].jumlah = ctx.message.text;
      const { service, productName, productCode, tujuan, jumlah } = purchaseData[userId];
      ctx.replyWithHTML(
        `Konfirmasi pesanan:\nLayanan: <b>${service} ${productName}</b>\nKode Produk: <b>${productCode}</b>\nTujuan: <b>${tujuan}</b>\nJumlah: <b>${jumlah}</b>`,
        Markup.inlineKeyboard([[Markup.button.callback('Beli', 'confirm_purchase')]])
      );
    }else if (purchaseData[userId].step === 'cek') {
      purchaseData[userId].cek = ctx.message.text;
      const  cek = purchaseData[userId].cek;
      console.log(cek)
      //
      try {
        const response = await fetch('https://irvankedesmm.co.id/api/status', {
           method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_id: '34343',
        api_key: '3hxspf-fkjszc-cexq96-w85sob-bhzmen',
        id: cek
      })
        });
        
        const result = await response.json();
        
        if (result.status === true) {
          ctx.reply(`Detail Pesanan Anda: \nStatus Pesanan: ${result.data.status}`);
        } else {
          ctx.reply(`Gagal memproses pesanan: ${result.msg}`);
          console.log(result)
        }
      } catch (error) {
        console.error('Error processing purchase:', error);
        ctx.reply('Terjadi kesalahan saat memproses pesanan. Silakan coba lagi nanti.');
      }
      
      delete purchaseData[userId];

      //
    }
  }
});

// Purchase confirmation handler
bot.action('confirm_purchase', async (ctx) => {
  ctx.answerCbQuery();
  const userId = ctx.from.id;
  if (purchaseData[userId]) {
    const { productCode, tujuan, jumlah } = purchaseData[userId];
    console.log(productCode+tujuan+jumlah)
    // Proses pembelian melalui API irvankedesmm
    try {
      const response = await fetch('https://irvankedesmm.co.id/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_id: '34343',
          api_key: '3hxspf-fkjszc-cexq96-w85sob-bhzmen',
          service: productCode,
          target: tujuan,
          quantity: parseInt(jumlah)
        })
      });
      
      const result = await response.json();
      
      if (result.status === true) {
        ctx.reply(`Pesanan berhasil diproses! ID Pesanan: ${result.data.id}`);
      } else {
        ctx.reply(`Gagal memproses pesanan: ${result.msg}`);
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      ctx.reply('Terjadi kesalahan saat memproses pesanan. Silakan coba lagi nanti.');
    }
    
    delete purchaseData[userId];
  } else {
    ctx.reply('Terjadi kesalahan. Silakan mulai kembali dari menu utama.');
  }
});

// Error handler
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('Terjadi kesalahan. Silakan coba lagi nanti.');
});

// Start the bot
bot.launch().then(() => {
  console.log('Bot telah aktif dan siap menerima pesan.');
}).catch((error) => {
  console.error('Gagal menjalankan bot:', error);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));