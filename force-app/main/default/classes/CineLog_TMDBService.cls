public with sharing class CineLog_TMDBService {

    public class MovieResult {
        public Integer tmdbId;
        public String  title;
        public String  overview;
        public String  releaseDate;
        public String  posterURL;
        public String  genres;
        public Decimal tmdbRating;
        public String  type;
        public Integer numberOfSeasons;
        public Integer numberOfEpisodes;
        public String  showStatus;
        public Integer runtime;
        public String  director;
        public String  castMembers;
        public String  language;
    }

    // ── Search Movies ─────────────────────────────────────────────
    public static List<MovieResult> searchMovies(String query) {
        String apiKey = CineLog_ConfigHelper.getTMDBKey();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(
            'callout:TMDB_API/search/movie?api_key=' + apiKey
            + '&query=' + EncodingUtil.urlEncode(query, 'UTF-8')
            + '&language=en-US&page=1'
        );
        req.setMethod('GET');
        req.setTimeout(20000);

        HttpResponse      res     = new Http().send(req);
        List<MovieResult> results = new List<MovieResult>();

        if (res.getStatusCode() == 200) {
            Map<String, Object> body   = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object>        movies = (List<Object>) body.get('results');
            for (Object m : movies) {
                MovieResult r = mapMovie((Map<String, Object>) m);
                r.type = 'Movie';
                results.add(r);
            }
        }
        return results;
    }

    // ── Search TV Shows ───────────────────────────────────────────
    public static List<MovieResult> searchTV(String query) {
        String apiKey = CineLog_ConfigHelper.getTMDBKey();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(
            'callout:TMDB_API/search/tv?api_key=' + apiKey
            + '&query=' + EncodingUtil.urlEncode(query, 'UTF-8')
            + '&language=en-US&page=1'
        );
        req.setMethod('GET');
        req.setTimeout(20000);

        HttpResponse      res     = new Http().send(req);
        List<MovieResult> results = new List<MovieResult>();

        if (res.getStatusCode() == 200) {
            Map<String, Object> body  = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object>        shows = (List<Object>) body.get('results');
            for (Object s : shows) {
                MovieResult r = mapTV((Map<String, Object>) s);
                r.type = 'TV Show';
                results.add(r);
            }
        }
        return results;
    }

    // ── Get Movie Details (includes runtime + language) ───────────
    public static MovieResult getMovieDetails(Integer tmdbId) {
        String apiKey = CineLog_ConfigHelper.getTMDBKey();
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:TMDB_API/movie/' + tmdbId + '?api_key=' + apiKey + '&language=en-US');
        req.setMethod('GET');
        req.setTimeout(20000);

        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() == 200) {
            Map<String, Object> movie = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            MovieResult r = mapMovie(movie);
            r.type     = 'Movie';
            r.genres   = extractGenres(movie);
            r.runtime  = movie.get('runtime') != null
                         ? (Integer) movie.get('runtime') : null;
            r.language = (String) movie.get('original_language');
            return r;
        }
        return null;
    }

    // ── Get TV Details (includes runtime + language) ──────────────
    public static MovieResult getTVDetails(Integer tmdbId) {
        String apiKey = CineLog_ConfigHelper.getTMDBKey();
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:TMDB_API/tv/' + tmdbId + '?api_key=' + apiKey + '&language=en-US');
        req.setMethod('GET');
        req.setTimeout(20000);

        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() == 200) {
            Map<String, Object> show = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            MovieResult r       = mapTV(show);
            r.type              = 'TV Show';
            r.genres            = extractGenres(show);
            r.numberOfSeasons   = show.get('number_of_seasons')  != null ? (Integer) show.get('number_of_seasons')  : null;
            r.numberOfEpisodes  = show.get('number_of_episodes') != null ? (Integer) show.get('number_of_episodes') : null;
            r.showStatus        = (String) show.get('status');
            r.language          = (String) show.get('original_language');

            // TV runtime — stored as a list, take first value
            List<Object> runtimes = (List<Object>) show.get('episode_run_time');
            if (runtimes != null && !runtimes.isEmpty()) {
                r.runtime = (Integer) runtimes[0];
            }

            // Creator name
            List<Object> creators = (List<Object>) show.get('created_by');
            if (creators != null && !creators.isEmpty()) {
                Map<String, Object> creator = (Map<String, Object>) creators[0];
                r.director = (String) creator.get('name');
            }
            return r;
        }
        return null;
    }

    // ── Get Credits (Movie) ───────────────────────────────────────
    public static Map<String, String> getMovieCredits(Integer tmdbId) {
        String apiKey = CineLog_ConfigHelper.getTMDBKey();
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:TMDB_API/movie/' + tmdbId + '/credits?api_key=' + apiKey);
        req.setMethod('GET');
        req.setTimeout(20000);

        HttpResponse res = new Http().send(req);
        Map<String, String> credits = new Map<String, String>();

        if (res.getStatusCode() == 200) {
            Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

            // Director from crew
            List<Object> crew = (List<Object>) body.get('crew');
            if (crew != null) {
                for (Object c : crew) {
                    Map<String, Object> member = (Map<String, Object>) c;
                    if (member.get('job') == 'Director') {
                        credits.put('director', (String) member.get('name'));
                        break;
                    }
                }
            }

            // Top 5 castMembers
            List<Object>  castMembers      = (List<Object>) body.get('castMembers');
            List<String>  castMembersNames = new List<String>();
            if (castMembers != null) {
                Integer count = 0;
                for (Object a : castMembers) {
                    if (count >= 5) break;
                    Map<String, Object> actor = (Map<String, Object>) a;
                    castMembersNames.add((String) actor.get('name'));
                    count++;
                }
            }
            credits.put('castMembers', String.join(castMembersNames, ', '));
        }
        return credits;
    }

    // ── Get Credits (TV) ──────────────────────────────────────────
    public static Map<String, String> getTVCredits(Integer tmdbId) {
        String apiKey = CineLog_ConfigHelper.getTMDBKey();
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:TMDB_API/tv/' + tmdbId + '/credits?api_key=' + apiKey);
        req.setMethod('GET');
        req.setTimeout(20000);

        HttpResponse res = new Http().send(req);
        Map<String, String> credits = new Map<String, String>();

        if (res.getStatusCode() == 200) {
            Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object>  castMembers      = (List<Object>) body.get('castMembers');
            List<String>  castMembersNames = new List<String>();
            if (castMembers != null) {
                Integer count = 0;
                for (Object a : castMembers) {
                    if (count >= 5) break;
                    Map<String, Object> actor = (Map<String, Object>) a;
                    castMembersNames.add((String) actor.get('name'));
                    count++;
                }
            }
            credits.put('castMembers', String.join(castMembersNames, ', '));
        }
        return credits;
    }

    // ── Private helpers ───────────────────────────────────────────
    private static MovieResult mapMovie(Map<String, Object> m) {
        MovieResult r = new MovieResult();
        r.tmdbId      = (Integer) m.get('id');
        r.title       = (String)  m.get('title');
        r.overview    = (String)  m.get('overview');
        r.releaseDate = (String)  m.get('release_date');
        r.tmdbRating  = m.get('vote_average') != null
                        ? Decimal.valueOf(String.valueOf(m.get('vote_average'))) : 0;
        String pp     = (String) m.get('poster_path');
        r.posterURL   = String.isNotBlank(pp) ? 'https://image.tmdb.org/t/p/w500' + pp : '';
        return r;
    }

    private static MovieResult mapTV(Map<String, Object> s) {
        MovieResult r = new MovieResult();
        r.tmdbId      = (Integer) s.get('id');
        r.title       = (String)  s.get('name');
        r.overview    = (String)  s.get('overview');
        r.releaseDate = (String)  s.get('first_air_date');
        r.tmdbRating  = s.get('vote_average') != null
                        ? Decimal.valueOf(String.valueOf(s.get('vote_average'))) : 0;
        String pp     = (String) s.get('poster_path');
        r.posterURL   = String.isNotBlank(pp) ? 'https://image.tmdb.org/t/p/w500' + pp : '';
        return r;
    }

    private static String extractGenres(Map<String, Object> data) {
        List<Object>  genreList = (List<Object>) data.get('genres');
        List<String>  names     = new List<String>();
        if (genreList != null) {
            for (Object g : genreList) {
                Map<String, Object> genre = (Map<String, Object>) g;
                names.add((String) genre.get('name'));
            }
        }
        return String.join(names, ', ');
    }
}