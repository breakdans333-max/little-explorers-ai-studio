
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
- Sahne sürelerinin toplamı tam olarak ${duration} saniye olsun.
- Beş sahne oluştur.

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

SAHNE 2:
Zaman:
Görsel:
Puffy'nin hareketi:
Türkçe konuşma:
English dialogue:
Ses ve efekt:

SAHNE 3:
Zaman:
Görsel:
Puffy'nin hareketi:
Türkçe konuşma:
English dialogue:
Ses ve efekt:

SAHNE 4:
Zaman:
Görsel:
Puffy'nin hareketi:
Türkçe konuşma:
English dialogue:
Ses ve efekt:

SAHNE 5:
Zaman:
Görsel:
Puffy'nin hareketi:
Türkçe konuşma:
English dialogue:
Ses ve efekt:

KAPANIŞ:
Eğlenceli ve kısa bir veda oluştur.

GÖRSEL ÜRETİM TALİMATI:
Her sahne için ayrı, karakter tutarlılığını
koruyan, dikey 9:16 formatında kullanılabilecek
ayrıntılı bir görsel üretim açıklaması hazırla.

Yalnızca istenen senaryo çıktısını ver.
`;
