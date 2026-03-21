List<CineLog_TMDBService.MovieResult> results = CineLog_TMDBService.searchMovies('Inception');
System.debug('Total results: ' + results.size());
if (!results.isEmpty()) {
    System.debug('First movie title: ' + results[0].title);
    System.debug('First movie tmdbId: ' + results[0].tmdbId);
    System.debug('First movie rating: ' + results[0].tmdbRating);
    System.debug('First movie poster: ' + results[0].posterURL);
}