public with sharing class CineLog_Controller {

    // search movies by query string and return a flat map list for the LWC
    @AuraEnabled
    public static List<Map<String, Object>> searchMovies(String query) {
        return toMapList(CineLog_TMDBService.searchMovies(query));
    }

    // same as above but for TV shows
    @AuraEnabled
    public static List<Map<String, Object>> searchTV(String query) {
        return toMapList(CineLog_TMDBService.searchTV(query));
    }

    // called when the detail card opens — fetches full info + cast/crew in one shot
    @AuraEnabled
    public static Map<String, Object> getFullDetails(Integer tmdbId, String type) {
        CineLog_TMDBService.MovieResult details;
        Map<String, String> credits;

        if (type == 'TV Show') {
            details = CineLog_TMDBService.getTVDetails(tmdbId);
            credits = CineLog_TMDBService.getTVCredits(tmdbId);
        } else {
            details = CineLog_TMDBService.getMovieDetails(tmdbId);
            credits = CineLog_TMDBService.getMovieCredits(tmdbId);
        }

        if (details == null) return null;

        return new Map<String, Object>{
            'tmdbId'           => details.tmdbId,
            'title'            => details.title,
            'overview'         => details.overview,
            'releaseDate'      => details.releaseDate,
            'posterURL'        => details.posterURL,
            'genres'           => details.genres,
            'tmdbRating'       => details.tmdbRating,
            'type'             => details.type,
            'runtime'          => details.runtime,
            'language'         => details.language,
            'numberOfSeasons'  => details.numberOfSeasons,
            'numberOfEpisodes' => details.numberOfEpisodes,
            'showStatus'       => details.showStatus,
            'director'         => credits.get('director'),
            'castMembers'      => credits.get('castMembers')
        };
    }

    // upsert a movie or show — matches on TMDB ID + owner so we don't create duplicates
    @AuraEnabled
    public static String saveMovie(
        Integer tmdbId,
        String  title,
        String  overview,
        String  releaseDate,
        String  posterURL,
        String  genres,
        Decimal tmdbRating,
        String  type,
        Integer numberOfSeasons,
        Integer numberOfEpisodes,
        String  showStatus,
        String  director,
        Integer runtime,
        String  castMembers,
        String  status
    ) {
        List<Movie__c> existing = [
            SELECT Id FROM Movie__c
            WHERE TMDB_ID__c = :tmdbId
            AND   OwnerId    = :UserInfo.getUserId()
            LIMIT 1
        ];

        Movie__c movie              = existing.isEmpty() ? new Movie__c() : existing[0];
        movie.Title__c              = title;
        movie.TMDB_ID__c            = tmdbId;
        movie.Overview__c           = overview;
        movie.Poster_URL__c         = posterURL;
        movie.Genres__c             = genres;
        movie.TMDB_Rating__c        = tmdbRating;
        movie.Type__c               = String.isNotBlank(type)   ? type   : 'Movie';
        movie.Status__c             = String.isNotBlank(status) ? status : 'Want to Watch';
        movie.Number_of_Seasons__c  = numberOfSeasons;
        movie.Number_of_Episodes__c = numberOfEpisodes;
        movie.Show_Status__c        = showStatus;
        movie.Director__c           = director;
        movie.Runtime__c            = runtime;
        movie.cast__c               = castMembers;

        if (String.isNotBlank(releaseDate)) {
            try { movie.Release_Date__c = Date.valueOf(releaseDate); }
            catch (Exception e) {}
        }

        upsert movie;
        return movie.Id;
    }

    // lightweight update — only touches status and personal rating, nothing else
    @AuraEnabled
    public static void updateMovieLog(
        String movieId,
        String status,
        String myRating
    ) {
        Movie__c movie     = new Movie__c(Id = movieId);
        movie.Status__c    = status;
        movie.My_Rating__c = myRating;
        update movie;
    }

    // lets the user swap in their own poster URL instead of the TMDB one
    @AuraEnabled
    public static void updateCustomPoster(String movieId, String posterURL) {
        Movie__c movie             = new Movie__c(Id = movieId);
        movie.Custom_Poster_URL__c = posterURL;
        update movie;
    }

    // powers the dashboard — one query, all the stats and bucketed lists we need
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getDashboardStats() {
        List<Movie__c> all = [
            SELECT Id, Title__c, Type__c, Status__c,
                   My_Rating__c, Genres__c, Poster_URL__c,
                   Custom_Poster_URL__c, CreatedDate
            FROM   Movie__c
            WHERE  OwnerId = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
        ];

        Integer totalCount    = all.size();
        Integer watchedCount  = 0;
        Integer watchingCount = 0;
        Integer backlogCount  = 0;
        Integer droppedCount  = 0;
        Integer movieCount    = 0;
        Integer tvCount       = 0;

        Integer goatCount       = 0;
        Integer perfectionCount = 0;
        Integer goodCount       = 0;
        Integer timepassCount   = 0;
        Integer disasterCount   = 0;

        Map<String, Integer> genreMap = new Map<String, Integer>();

        List<Map<String, Object>> goatList       = new List<Map<String, Object>>();
        List<Map<String, Object>> perfectionList = new List<Map<String, Object>>();
        List<Map<String, Object>> goodList       = new List<Map<String, Object>>();
        List<Map<String, Object>> timepassList   = new List<Map<String, Object>>();
        List<Map<String, Object>> disasterList   = new List<Map<String, Object>>();
        List<Map<String, Object>> recentList     = new List<Map<String, Object>>();

        Integer recentCount = 0;

        for (Movie__c m : all) {
            if      (m.Status__c == 'Watched')       watchedCount++;
            else if (m.Status__c == 'Watching')      watchingCount++;
            else if (m.Status__c == 'Want to Watch') backlogCount++;
            else if (m.Status__c == 'Dropped')       droppedCount++;

            if      (m.Type__c == 'Movie')   movieCount++;
            else if (m.Type__c == 'TV Show') tvCount++;

            Map<String, Object> movieMap = new Map<String, Object>{
                'id'       => m.Id,
                'title'    => m.Title__c,
                'posterSrc'=> String.isNotBlank(m.Custom_Poster_URL__c)
                              ? m.Custom_Poster_URL__c : m.Poster_URL__c,
                'rating'   => m.My_Rating__c,
                'type'     => m.Type__c
            };

            if (m.My_Rating__c == 'GOAT')       { goatCount++;       goatList.add(movieMap);       }
            if (m.My_Rating__c == 'Perfection') { perfectionCount++; perfectionList.add(movieMap); }
            if (m.My_Rating__c == 'Good')       { goodCount++;       goodList.add(movieMap);       }
            if (m.My_Rating__c == 'Timepass')   { timepassCount++;   timepassList.add(movieMap);   }
            if (m.My_Rating__c == 'Disaster')   { disasterCount++;   disasterList.add(movieMap);   }

            // keep only the 5 most recent watched entries
            if (m.Status__c == 'Watched' && recentCount < 5) {
                recentList.add(movieMap);
                recentCount++;
            }

            // split the comma-separated genre string and tally each one
            if (String.isNotBlank(m.Genres__c)) {
                for (String g : m.Genres__c.split(',')) {
                    String genre = g.trim();
                    if (String.isNotBlank(genre)) {
                        genreMap.put(genre, (genreMap.containsKey(genre) ? genreMap.get(genre) : 0) + 1);
                    }
                }
            }
        }

        // turn the genre map into a list so the LWC can iterate over it
        List<Map<String, Object>> genreList = new List<Map<String, Object>>();
        for (String genre : genreMap.keySet()) {
            genreList.add(new Map<String, Object>{
                'name'  => genre,
                'count' => genreMap.get(genre)
            });
        }

        return new Map<String, Object>{
            'totalCount'     => totalCount,
            'watchedCount'   => watchedCount,
            'watchingCount'  => watchingCount,
            'backlogCount'   => backlogCount,
            'droppedCount'   => droppedCount,
            'movieCount'     => movieCount,
            'tvCount'        => tvCount,
            'goatCount'      => goatCount,
            'perfectionCount'=> perfectionCount,
            'goodCount'      => goodCount,
            'timepassCount'  => timepassCount,
            'disasterCount'  => disasterCount,
            'genreList'      => genreList,
            'recentList'     => recentList,
            'goatList'       => goatList,
            'perfectionList' => perfectionList,
            'goodList'       => goodList,
            'timepassList'   => timepassList,
            'disasterList'   => disasterList
        };
    }

    // pull everything we need for the main log view, newest entries first
    @AuraEnabled(cacheable=true)
    public static List<Movie__c> getSavedMovies() {
        return [
            SELECT Id, Title__c, TMDB_ID__c, Overview__c,
                   Release_Date__c, Poster_URL__c, Genres__c,
                   TMDB_Rating__c, Status__c, My_Rating__c,
                   Type__c, Number_of_Seasons__c,
                   Number_of_Episodes__c, Show_Status__c,
                   Director__c, Runtime__c, Cast__c,
                   Custom_Poster_URL__c, Watch_Date__c
            FROM   Movie__c
            WHERE  OwnerId = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
        ];
    }

    // hard delete — checks ownership first so users can't delete each other's records
    @AuraEnabled
    public static void deleteMovie(String movieId) {
        Movie__c movie = [
            SELECT Id, OwnerId FROM Movie__c
            WHERE Id = :movieId LIMIT 1
        ];
        if (movie.OwnerId != UserInfo.getUserId()) {
            throw new AuraHandledException('Unauthorized');
        }
        delete movie;
    }

    // sends the user's message to Gemini along with their saved library as context
    @AuraEnabled
    public static String aiChat(String userMessage) {
        List<Movie__c> movies = [
            SELECT Title__c, Type__c, Status__c,
                   My_Rating__c, Genres__c, Director__c
            FROM   Movie__c
            WHERE  OwnerId = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
            LIMIT  50
        ];

        List<String> lines = new List<String>();
        for (Movie__c m : movies) {
            String line = '- ' + m.Title__c
                + ' (' + (m.Type__c != null ? m.Type__c : 'Movie') + ')'
                + ' | Status: ' + (m.Status__c != null ? m.Status__c : 'Unknown')
                + (m.My_Rating__c != null ? ' | Rating: '    + m.My_Rating__c : '')
                + (m.Genres__c    != null ? ' | Genres: '    + m.Genres__c    : '')
                + (m.Director__c  != null ? ' | Director: '  + m.Director__c  : '');
            lines.add(line);
        }

        String moviesContext = lines.isEmpty()
            ? 'The user has not saved any movies yet.'
            : String.join(lines, '\n');

        return CineLog_GeminiService.chat(userMessage, moviesContext);
    }

    // converts a list of MovieResult objects into plain maps the LWC can consume
    private static List<Map<String, Object>> toMapList(
        List<CineLog_TMDBService.MovieResult> results
    ) {
        List<Map<String, Object>> mapped = new List<Map<String, Object>>();
        for (CineLog_TMDBService.MovieResult r : results) {
            mapped.add(new Map<String, Object>{
                'tmdbId'           => r.tmdbId,
                'title'            => r.title,
                'overview'         => r.overview,
                'releaseDate'      => r.releaseDate,
                'posterURL'        => r.posterURL,
                'genres'           => r.genres,
                'tmdbRating'       => r.tmdbRating,
                'type'             => r.type,
                'numberOfSeasons'  => r.numberOfSeasons,
                'numberOfEpisodes' => r.numberOfEpisodes,
                'showStatus'       => r.showStatus
            });
        }
        return mapped;
    }
}