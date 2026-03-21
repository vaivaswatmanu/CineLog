public with sharing class CineLog_GeminiService {
    public static String chat(String userMessage, String moviesContext) {
    String apiKey  = CineLog_ConfigHelper.getGeminiKey();

    String systemPrompt =
    'You are CineLog AI — a witty, opinionated personal movie advisor with serious cinephile energy. '
    + 'You address the user as "Men of Culture" always. '
    + 'You are passionate, slightly dramatic about great cinema, and brutally honest about bad ones. '
    + 'Keep ALL responses under 3 sentences maximum — be sharp and punchy, never ramble. '
    + 'When recommending movies, always mention WHY based on their taste. '
    + 'Their rating system: GOAT (all time favourite), Perfection (near flawless), '
    + 'Good (solid watch), Timepass (average), Disaster (terrible). '
    + 'Here is the user\'s current watchlist:\n\n'
    + moviesContext
    + '\n\nNow answer the user\'s question. Remember: short, punchy, personality.';

    Map<String, Object> textPart = new Map<String, Object>{
        'text' => systemPrompt + '\n\nUser: ' + userMessage
    };
    Map<String, Object> content = new Map<String, Object>{
        'parts' => new List<Object>{ textPart }
    };
    Map<String, Object> body = new Map<String, Object>{
        'contents' => new List<Object>{ content }
    };

    HttpRequest req = new HttpRequest();
    req.setEndpoint('callout:Gemini_API/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey);
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    req.setBody(JSON.serialize(body));
    req.setTimeout(30000);

    HttpResponse res = new Http().send(req);

    if (res.getStatusCode() == 200) {
        Map<String, Object> resBody    = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Object>        candidates = (List<Object>) resBody.get('candidates');
        if (candidates != null && !candidates.isEmpty()) {
            Map<String, Object> candidate  = (Map<String, Object>) candidates[0];
            Map<String, Object> contentObj = (Map<String, Object>) candidate.get('content');
            List<Object>        parts      = (List<Object>) contentObj.get('parts');
            Map<String, Object> firstPart  = (Map<String, Object>) parts[0];
            return (String) firstPart.get('text');
        }
    }
    return 'Sorry, I could not process that. Please try again.';
}

//     public static String generateSummary(String title, String overview) {
//         String apiKey  = CineLog_ConfigHelper.getGeminiKey();
//         String baseURL = CineLog_ConfigHelper.getGeminiBaseURL();

//         // ── Build prompt ──────────────────────────────────────────
//         String systemPrompt =
//     'You are CineLog AI — a witty, opinionated personal movie advisor with serious cinephile energy. '
//     + 'You address the user as "Men of Culture" always. '
//     + 'You are passionate, slightly dramatic about great cinema, and brutally honest about bad ones. '
//     + 'Keep ALL responses under 3 sentences maximum — be sharp and punchy, never ramble. '
//     + 'When recommending movies, always mention WHY based on their taste. '
//     + 'Their rating system: GOAT (all time favourite), Perfection (near flawless), '
//     + 'Good (solid watch), Timepass (average), Disaster (terrible). '
//     + 'Here is the user\'s current watchlist:\n\n'
//     + moviesContext
//     + '\n\nNow answer the user\'s question. Remember: short, punchy, personality.';

//         // ── Build request body ────────────────────────────────────
//         Map<String, Object> part    = new Map<String, Object>{ 'text' => prompt };
//         Map<String, Object> content = new Map<String, Object>{
//             'parts' => new List<Object>{ part }
//         };
//         Map<String, Object> body    = new Map<String, Object>{
//             'contents' => new List<Object>{ content }
//         };

//         // ── HTTP call ─────────────────────────────────────────────
//         HttpRequest req = new HttpRequest();
//         req.setEndpoint('callout:Gemini_API/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey);       
//         req.setMethod('POST');
//         req.setHeader('Content-Type', 'application/json');
//         req.setBody(JSON.serialize(body));
//         req.setTimeout(30000);

//         HttpResponse res = new Http().send(req);

//         // ── Parse response ────────────────────────────────────────
//         if (res.getStatusCode() == 200) {
//             Map<String, Object> resBody    = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
//             List<Object>        candidates = (List<Object>) resBody.get('candidates');

//             if (candidates != null && !candidates.isEmpty()) {
//                 Map<String, Object> candidate  = (Map<String, Object>) candidates[0];
//                 Map<String, Object> contentObj = (Map<String, Object>) candidate.get('content');
//                 List<Object>        parts      = (List<Object>) contentObj.get('parts');
//                 Map<String, Object> firstPart  = (Map<String, Object>) parts[0];
//                 return (String) firstPart.get('text');
//             }
//         }
// System.debug('Gemini Status: ' + res.getStatusCode());
// System.debug('Gemini Body: ' + res.getBody());

//         return null;
//     }
}