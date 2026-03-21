// Get the demo user Id
User demoUser = [
    SELECT Id FROM User
    WHERE Username = 'vaivaswatmanu0047@gmail.com'
    LIMIT 1
];

// Reassign all movies to demo user
List<Movie__c> movies = [
    SELECT Id FROM Movie__c
    WHERE OwnerId = :UserInfo.getUserId()
];

for (Movie__c m : movies) {
    m.OwnerId = demoUser.Id;
}

update movies;
System.debug('Reassigned ' + movies.size() + ' movies to demo user.');