
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate") {
      if (request.method !== "POST") {
        return Response.json(
          { error: "Yalnızca POST isteği kabul edilir." },
          { status: 405 }
        );
      }

      if (!env.GROQ_API_KEY) {
        return Response.json(
          { error: "Groq API anahtarı yapılandırılmamış." },
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
            { error: "Geçerli bir video konusu gir." },
            { status: 400 }
          );
        }

        if (![25, 30, 45, 60].includes(duration)) {
          return Response.json(
            { error: "Video süresi geçersiz." },
            { status: 400 }
          );
        }

        const prompt = `
Little Explorers adlı çocuk eğitim kanalı için
3-6 yaş grubuna uygun bir YouTube Shorts senaryosu yaz.

Konu: ${topic}
Dil: ${language}
Süre: ${duration} saniye
Ek not: ${details}

Ana karakter Puffy:
Krem renkli tüylü, turkuaz gözlü,
turkuaz sırt çantalı sevimli bir karakter.

Kurallar:
- Beş sahne oluştur.
- Sahnelerin zaman aralıkları toplam süreyi tam karşılasın.
- Her sahne için görsel açıklaması yaz.
- Türkçe ve İngilizce kısa konuşmalar ekle.
- Basit, doğru ve yaşa uygun bilgiler kullan.
- Korkutucu, tehlikeli veya uygunsuz içerik kullanma.
- Çocuklardan kişisel bilgi isteme.
- Çıktıyı Türkçe başlıklarla düzenle.
- Yalnızca senaryoyu döndür.
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
                  content: "Sen çocuklara yönelik eğitim içerikleri hazırlayan dikkatli bir senaristsin."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_completion_tokens: 2500
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          return Response.json(
            { error: "Groq isteği başarısız oldu. API ayarlarını kontrol et." },
            { status: 502 }
          );
        }

        const script = result.choices?.[0]?.message?.content;

        if (!script) {
          return Response.json(
            { error: "AI boş yanıt döndürdü." },
            { status: 502 }
          );
        }

        return Response.json({ success: true, script });

      } catch (error) {
        return Response.json(
          { error: "İstek işlenemedi. Girdi bilgilerini kontrol et." },
          { status: 400 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
