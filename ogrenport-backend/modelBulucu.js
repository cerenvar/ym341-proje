import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("------------------------------------------------");
console.log("🔍 Google'a soruluyor: 'Bu anahtarla hangi modelleri kullanabilirim?'");
console.log("------------------------------------------------");

fetch(url)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.error("❌ HATA: API Anahtarında sorun var!");
      console.error("Mesaj:", data.error.message);
    } else if (data.models) {
      console.log("✅ BAŞARILI! İşte kullanabileceğin gerçek model isimleri:\n");
      
      // Sadece 'chat' yapabilen modelleri filtrele
      const chatModelleri = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
      
      chatModelleri.forEach(model => {
        // Modelin adını temizleyip gösterelim (örn: models/gemini-pro -> gemini-pro)
        console.log(`   👉 ${model.name.replace('models/', '')}`);
      });
      
      console.log("\n------------------------------------------------");
      console.log("İPUCU: Yukarıdaki listeden birini seçip aiController.js dosyasına yazacağız.");
    } else {
      console.log("⚠️ İlginç... Hata yok ama model listesi de boş döndü.");
    }
  })
  .catch(err => console.error("Bağlantı Hatası:", err));