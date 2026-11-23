
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
if (url.pathname === "/api/health") {
  return Response.json({
    worker: "active",
    groqConfigured: Boolean(env.GROQ_API_KEY)
  });
}
    if (url.pathname === "/api/generate") {
      if (request.method !== "POST") {
        return Response.json(
      
if (request.method !== "POST") {
  return Response.json(
    { success: false, error: "Yalnızca POST isteği kabul edilir." },
    { status: 405 }
  );
}

return Response.json({
  success: true,
  script: "Tanılama sonucu: GROQ_API_KEY = " +
    String(Boolean(env.GROQ_API_KEY))
});

if (!env.GROQ_API_KEY) {
  return Response.json(
    { success: false, error: "Groq API anahtarı yapılandırılmamış." },
    { status: 500 }
  );
}

      }

      if (!env.GROQ_API_KEY) {
        return Response.json(
          { success: false, error: "Groq API anahtarı yapılandırılmamış." },
          { status: 500 }
        );
      }

      try {
        const data = await request.json();

        const topic = String(data.topic || "").trim();
        const duration = Number(data.duration);
        const language = String(data.language || "Türkçe + English");
        const details = String(data.details || "").slice(0, 500);

        if (!topic || topic.length > 150) {
          return Response.json(
            { success: false, error: "Geçerli bir video konusu gir." },
            { status: 400 }
          );
        }

        if (![25, 30, 45, 60].includes(duration)) {
          return Response.json(
            { success: false, error: "Video süresi geçersiz." },
            { status: 400 }
          );
        }

        const prompt = `
Sen Little Explorers adlı çocuk eğitim kanalının
profesyonel senaryo ve yaratıcı içerik yönetmenisin.

GÖREV:
Verilen konuya göre tamamen otomatik,
özgün ve eğitici bir YouTube Shorts senaryosu oluştur.

KONU: ${topic}
DİL: ${language}
SÜRE: ${duration} saniye
EK NOT: ${details || "Yaratıcı kararları kendin ver."}

HEDEF KİTLE:
3-6 yaş çocuklar.

ANA KARAKTER PUFFY:
- Krem renkli, yumuşak tüylü.
- Büyük turkuaz gözlü.
- Sevimli, hareketli ve meraklı.
- Turkuaz sırt çantasında altın yıldız bulunur.
- Bütün sahnelerde aynı karakter görünümünü koru.

OTOMATİK SENARYO KURALLARI:
- Konuya uygun öğretici nesneleri kendin seç.
- Her sahnede farklı ve anlamlı bir olay oluştur.
- Genel ve tekrarlayan cümleler kullanma.
- Çocuklara basit sorular sor.
- Doğru cevabı açık ve eğlenceli şekilde öğret.
- Türkçe ve İngilizce kısa konuşmalar yaz.
- Bilgiler bilimsel olarak doğru ve yaşa uygun olsun.
- Korkutucu veya tehlikeli içerik oluşturma.
- Çocuklardan kişisel bilgi isteme.
- Her sahnenin görselini ayrıntılı tarif et.
- 3D çizgi film estetiğini koru.
- Dikey 9:16 video formatını dikkate al.
- Sahne sürelerinin toplamı tam olarak ${duration} saniye olsun.
- Tam olarak beş sahne oluştur.
- Konuya uygun nesne ve örnekleri kendin belirle.
- Her sahnede Puffy'nin hareketini açıkça anlat.

ÇIKTI FORMATI:

VİDEO BAŞLIĞI:
VİDEONUN EĞİTİCİ AMACI:
YOUTUBE AÇIKLAMASI:
ETİKETLER:

SAHNE 1:
Zaman:
Görsel:
Puffy'nin hareketi:
Türkçe konuşma:
English dialogue:
Ses ve efekt:
Görsel üretim açıklaması:

SAHNE 2:
Zaman:
Görsel:
Puffy'nin hareketi:
Türkçe konuşma:
English dialogue:
Ses ve efekt:
Görsel üretim açıklaması:

SAHNE 3:
Zaman:
Görsel:
Puffy'nin hareketi:
Türkçe konuşma:
English dialogue:
Ses ve efekt:
Görsel üretim açıklaması:

SAHNE 4:
Zaman:
Görsel:
Puffy'nin hareketi:
Türkçe konuşma:
English dialogue:
Ses ve efekt:
Görsel üretim açıklaması:

SAHNE 5:
Zaman:
Görsel:
Puffy'nin hareketi:
Türkçe konuşma:
English dialogue:
Ses ve efekt:
Görsel üretim açıklaması:

KAPANIŞ:
Eğlenceli ve kısa bir veda oluştur.

ÖNEMLİ:
Yalnızca istenen senaryo çıktısını ver.
Senaryo dışında açıklama ekleme.
`;

        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.GROQ_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: "Sen çocuklara yönelik güvenli, yaratıcı ve eğitici içerikler hazırlayan profesyonel bir senaristsin."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 3500
            })
          }
        );

        const responseText = await response.text();

        let result;

        try {
          result = JSON.parse(responseText);
        } catch {
          return Response.json(
            {
              success: false,
              error: "Groq yanıtı okunamadı."
            },
            { status: 502 }
          );
        }

        if (!response.ok) {
          const groqError =
            result.error?.message || "Bilinmeyen Groq API hatası.";

          return Response.json(
            {
              success: false,
              error: "Groq API hatası: " + groqError
            },
            { status: 502 }
          );
        }

        const script = result.choices?.[0]?.message?.content;

        if (!script) {
          return Response.json(
            {
              success: false,
              error: "AI boş yanıt döndürdü."
            },
            { status: 502 }
          );
        }

        return Response.json({
          success: true,
          script
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "İstek işlenemedi: " + error.message
          },
          { status: 400 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
