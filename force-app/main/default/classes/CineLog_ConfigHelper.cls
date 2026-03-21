public with sharing class CineLog_ConfigHelper {

    private static CineLog_Config__mdt cachedConfig;

    private static CineLog_Config__mdt getConfig() {
        if (cachedConfig == null) {
            cachedConfig = [
                SELECT TMDB_API_Key__c,
                       Gemini_API_Key__c,
                       TMDB_Base_URL__c,
                       Gemini_Base_URL__c
                FROM   CineLog_Config__mdt
                WHERE  DeveloperName = 'Default'
                LIMIT  1
            ];
        }
        return cachedConfig;
    }

    public static String getTMDBKey()      { return getConfig().TMDB_API_Key__c;    }
    public static String getGeminiKey()    { return getConfig().Gemini_API_Key__c;  }
    public static String getTMDBBaseURL()  { return getConfig().TMDB_Base_URL__c;   }
    public static String getGeminiBaseURL(){ return getConfig().Gemini_Base_URL__c; }
}