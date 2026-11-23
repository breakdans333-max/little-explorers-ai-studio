
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Sunucu kontrolü
    if (url.pathname === "/api/health") {
      return Response.json({
        worker: "active",
        groqConfigured: Boolean(env.GROQ_API_KEY),
        aiConfigured: Boolean(env.AI)
      });
    }

    // 2. Tek sahne görseli üretimi
    if (url.pathname === "/api/generate-image") {
      if (request.method !== "POST") {
        return Response.json(
          { success: false, error: "Yalnızca POST isteği kabul edilir." },
          { status: 405 }
        );
      }

      if (!env.AI) {
        return Response.json(
          { success: false, error: "Workers AI bağlantısı bulunamadı." },
          { status: 500 }
        );
      }

      try {
        const body = await request.json();
        const prompt = String(body.prompt || "").trim();

        if (!prompt || prompt.length > 2048) {
          return Response.json(
            { success: false, error: "Görsel açıklaması boş veya çok uzun." },
            { status: 400 }
          );
        }

        const result = await env.AI.run(
          "@cf/black-forest-labs/flux-1-schnell",
          { prompt }
        );

        if (!result.image) {
          throw new Error("Görsel modeli boş yanıt döndürdü.");
        }

        return Response.json({
          success: true,
          image: "data:image/jpeg;base64," + result.image
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "Görsel üretilemedi: " + error.message
          },
          { status: 502 }
        );
      }
    }

    // 3. Otomatik senaryo ve sahne oluşturma
    if (url.pathname === "/api/generate") {
      if (request.method !== "POST") {
        return Response.json(
          { success: false, error: "Yalnızca POST isteği kabul edilir." },
          { status: 405 }
        );
      }

      if (!env.GROQ_API_KEY) {
        return Response.json(
          { success: false, error: "Groq API anahtarı yapılandırılmamış." },
          { status: 500 }
        );
      }

      try {
        const body = await request.json();

        const topic = String(body.topic || "").trim();
        const language = String(body.language || "Türkçe + English");
        const duration = Number(body.duration || 30);
        const details = String(body.details || "").trim();

        if (!topic) {
          return Response.json(
            { success: false, error: "Lütfen video konusunu yaz." },
            { status: 400 }
          );
        }

        if (![25, 30, 45, 60].includes(duration)) {
          return Response.json(
            { success: false, error: "Geçersiz video süresi." },
            { status: 400 }
          );
        }

        const sceneCount = duration <= 30 ? 5 : duration === 45 ? 6 : 8;

        const prompt = `
Sen Little Explorers çocuk eğitim kanalının yaratıcı yönetmenisin.

ANA KARAKTER PUFFY:
- Krem beyaz, yumuşak ve kabarık tüylü vücut
- Büyük turkuaz gözler
- Şeftali tonlarında kulak içleri
- Küçük kahverengi burun
- Turkuaz sırt çantası
- Çantanın üzerinde altın yıldız

ÇOK ÖNEMLİ:
Puffy'nin görünüşü bütün sahnelerde aynı olmalı.
Her görsel promptunda bu karakter özelliklerini tekrar belirt.
Puffy'nin kıyafetini, rengini, yüzünü veya çantasını değiştirme.

HEDEF:
3-6 yaş arası çocuklar.

VİDEO BİLGİLERİ:
Konu: ${topic}
Dil: ${language}
Süre: ${duration} saniye
Sahne sayısı: Tam olarak ${sceneCount}
Ek bilgiler: ${details || "Yok"}

YARATICI KURALLAR:
- Dikey 9:16 YouTube Shorts.
- Sevimli, kaliteli 3D çizgi film estetiği.
- Canlı ve uyumlu renkler.
- Çocuklara uygun, güvenli ve eğitici içerik.
- İlk sahne ilk 3 saniyede dikkat çekmeli.
- Her sahnede Puffy görünmeli.
- Her sahne farklı bir ortam veya aksiyon içermeli.
- Görsellerde yazı, altyazı, logo veya filigran bulunmamalı.
- Görsel promptları İngilizce ve ayrıntılı olmalı.
- Her sahne için hareket, kamera ve ses bilgisi ver.
- Türkçe ve İngilizce seslendirme üret.
- Sahne zamanları sıfırdan başlamalı, birbirini takip etmeli ve toplam süre tam ${duration} saniye olmalı.
- Sahne sayısı tam olarak ${sceneCount} olmalı.

YANITI SADECE GEÇERLİ JSON OLARAK VER.
Markdown veya kod bloğu kullanma.

JSON ŞEMASI:

{
  "title_tr": "Türkçe video başlığı",
  "title_en": "English video title",
  "duration": ${duration},
  "scenes": [
    {
      "scene_number": 1,
      "start": 0,
      "end": 5,
      "image_prompt": "Detailed English 3D cartoon image prompt. Include Puffy's complete fixed appearance.",
      "motion": "Puffy's movement and facial expression",
      "camera": "Camera movement",
      "voice_tr": "Türkçe seslendirme",
      "voice_en": "English narration",
      "text_tr": "Türkçe ekran yazısı",
      "text_en": "English screen text",
      "sound_effect": "Sound effect"
    }
  ],
  "description_tr": "Türkçe YouTube açıklaması",
  "description_en": "English YouTube description",
  "tags": ["#Shorts", "#LittleExplorers"]
}

Sahnelerin başlangıç ve bitiş zamanlarını doğru hesapla.
Bütün sahneleri eksiksiz üret.
JSON dışında hiçbir şey yazma.
`;

        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + env.GROQ_API_KEY,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content: "Sen profesyonel bir çocuk video senaristi ve yapılandırılmış JSON üreticisisin. Yalnızca geçerli JSON döndür."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 6000
            })
          }
        );

        const responseText = await response.text();
        let result;

        try {
          result = JSON.parse(responseText);
        } catch {
          return Response.json(
            { success: false, error: "Groq geçerli bir yanıt döndürmedi." },
            { status: 502 }
          );
        }

        if (!response.ok) {
          return Response.json(
            {
              success: false,
              error: result.error?.message || "Groq API hatası."
            },
            { status: 502 }
          );
        }

        const content = result.choices?.[0]?.message?.content;

        if (!content) {
          return Response.json(
            { success: false, error: "AI boş yanıt döndürdü." },
            { status: 502 }
          );
        }

        let project;

        try {
          project = JSON.parse(content);
        } catch {
          return Response.json(
            { success: false, error: "AI geçerli sahne JSON'u oluşturamadı." },
            { status: 502 }
          );
        }

        if (
          !Array.isArray(project.scenes) ||
          project.scenes.length !== sceneCount
        ) {
          return Response.json(
            {
              success: false,
              error: "AI beklenen sayıda sahne oluşturamadı. Lütfen yeniden dene."
            },
            { status: 502 }
          );
        }

        for (let i = 0; i < project.scenes.length; i++) {
          const scene = project.scenes[i];

          if (
            !scene.image_prompt ||
            String(scene.image_prompt).length > 2048
          ) {
            return Response.json(
              {
                success: false,
                error: (i + 1) + ". sahnenin görsel açıklaması eksik veya çok uzun."
              },
              { status: 502 }
            );
          }
        }

        return Response.json({
          success: true,
          project
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "İstek işlenemedi: " + error.message
          },
          { status: 500 }
        );
      }
    }

    // 4. Diğer istekleri web paneline yönlendir
    return env.ASSETS.fetch(request);
  }
};
