import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getDashboardStats from '@salesforce/apex/CineLog_Controller.getDashboardStats';
import searchMovies      from '@salesforce/apex/CineLog_Controller.searchMovies';
import searchTV          from '@salesforce/apex/CineLog_Controller.searchTV';
import getSavedMovies    from '@salesforce/apex/CineLog_Controller.getSavedMovies';

const DEFAULT_MOVIE_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%2313131A'/%3E%3Ctext x='150' y='210' text-anchor='middle' font-size='48' fill='%237C3AED'%3E%F0%9F%8E%AC%3C/text%3E%3Ctext x='150' y='270' text-anchor='middle' font-size='16' fill='%239CA3AF' font-family='sans-serif'%3ENo Poster%3C/text%3E%3C/svg%3E";
const DEFAULT_TV_POSTER    = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%2313131A'/%3E%3Ctext x='150' y='210' text-anchor='middle' font-size='48' fill='%237C3AED'%3E%F0%9F%93%BA%3C/text%3E%3Ctext x='150' y='270' text-anchor='middle' font-size='16' fill='%239CA3AF' font-family='sans-serif'%3ENo Poster%3C/text%3E%3C/svg%3E";

const RATING_CLASSES = {
    'GOAT'       : 'rating-badge goat',
    'Perfection' : 'rating-badge perfection',
    'Good'       : 'rating-badge good',
    'Timepass'   : 'rating-badge timepass',
    'Disaster'   : 'rating-badge disaster'
};

export default class CineLog extends LightningElement {

    @track activeTab             = 'home';
    @track searchQuery           = '';
    @track searchType            = 'Movie';
    @track searchResults         = [];
    @track isSearching           = false;
    @track searchDone            = false;
    @track savedMovies           = [];
    @track isDetailOpen          = false;
    @track dashboardStats        = null;
    @track selectedSavedMovie    = null;
    @track selectedSearchResult  = null;
    @track isAIChatOpen = false;

    wiredMoviesResult;
    wiredDashboardResult;

    // ── Wires ─────────────────────────────────────────────────────
    @wire(getDashboardStats)
wiredDashboard(result) {
    this.wiredDashboardResult = result;
    if (result.data) this.dashboardStats = result.data;
}
    @wire(getSavedMovies)
    wiredMovies(result) {
        this.wiredMoviesResult = result;
        if (result.data) {
            this.savedMovies = result.data.map(m => ({
                ...m,
                posterSrc  : m.Custom_Poster_URL__c || m.Poster_URL__c ||
                             (m.Type__c === 'TV Show' ? DEFAULT_TV_POSTER : DEFAULT_MOVIE_POSTER),
                ratingClass: m.My_Rating__c ? RATING_CLASSES[m.My_Rating__c] : ''
            }));
        }
    }

    // ── View getters ──────────────────────────────────────────────
    get isLibraryView()  { return ['home','movies','tv'].includes(this.activeTab); }
    get isSearchView()   { return this.activeTab === 'search';    }
    get isDashboardView(){ return this.activeTab === 'dashboard'; }

    // ── Tab class getters ─────────────────────────────────────────
    get homeTabClass()   { return this.tabClass('home');      }
    get moviesTabClass() { return this.tabClass('movies');    }
    get tvTabClass()     { return this.tabClass('tv');        }
    get dashTabClass()   { return this.tabClass('dashboard'); }
    get searchTabClass() { return this.tabClass('search') + ' search-tab'; }

    tabClass(tab) { return this.activeTab === tab ? 'nav-tab active' : 'nav-tab'; }

    // ── Library shelf lists ───────────────────────────────────────
    get filteredMovies() {
        if (this.activeTab === 'movies') return this.savedMovies.filter(m => m.Type__c === 'Movie');
        if (this.activeTab === 'tv')     return this.savedMovies.filter(m => m.Type__c === 'TV Show');
        return this.savedMovies;
    }

    get watchingList()    { return this.filteredMovies.filter(m => m.Status__c === 'Watching');      }
    get wantToWatchList() { return this.filteredMovies.filter(m => m.Status__c === 'Want to Watch'); }
    get watchedList()     { return this.filteredMovies.filter(m => m.Status__c === 'Watched');       }
    get droppedList()     { return this.filteredMovies.filter(m => m.Status__c === 'Dropped');       }

    get isLibraryEmpty() {
        return this.watchingList.length    === 0 &&
               this.wantToWatchList.length === 0 &&
               this.watchedList.length     === 0 &&
               this.droppedList.length     === 0;
    }

    // ── Search getters ────────────────────────────────────────────
    get movieSearchClass()  { return this.searchType === 'Movie'   ? 'type-btn active' : 'type-btn'; }
    get tvSearchClass()     { return this.searchType === 'TV Show' ? 'type-btn active' : 'type-btn'; }
    get searchPlaceholder() { return this.searchType === 'Movie'   ? 'Search movies...' : 'Search TV shows...'; }
    get hasSearchResults()  { return this.searchResults.length > 0; }
    get showNoResults()     { return this.searchDone && !this.isSearching && this.searchResults.length === 0; }

    // ── Dashboard stat getters ────────────────────────────────────
    get totalCount()      { return this.dashboardStats?.totalCount      || 0; }
    get watchedCount()    { return this.dashboardStats?.watchedCount    || 0; }
    get watchingCount()   { return this.dashboardStats?.watchingCount   || 0; }
    get backlogCount()    { return this.dashboardStats?.backlogCount    || 0; }
    get droppedCount()    { return this.dashboardStats?.droppedCount    || 0; }
    get movieCount()      { return this.dashboardStats?.movieCount      || 0; }
    get tvCount()         { return this.dashboardStats?.tvCount         || 0; }
    get goatCount()       { return this.dashboardStats?.goatCount       || 0; }
    get perfectionCount() { return this.dashboardStats?.perfectionCount || 0; }
    get goodCount()       { return this.dashboardStats?.goodCount       || 0; }
    get timepassCount()   { return this.dashboardStats?.timepassCount   || 0; }
    get disasterCount()   { return this.dashboardStats?.disasterCount   || 0; }
    get genreList()       { return this.dashboardStats?.genreList       || []; }
    get recentList()      { return this.dashboardStats?.recentList      || []; }
    get goatList()        { return this.dashboardStats?.goatList        || []; }
    get perfectionList()  { return this.dashboardStats?.perfectionList  || []; }
    get goodList()        { return this.dashboardStats?.goodList        || []; }
    get timepassList()    { return this.dashboardStats?.timepassList    || []; }
    get disasterList()    { return this.dashboardStats?.disasterList    || []; }

    // ── Dashboard bar getters ─────────────────────────────────────
    get movieTvMaxCount() { return Math.max(this.movieCount, this.tvCount) || 1; }
    get movieBarStyle()   { return `width:${Math.round((this.movieCount / this.movieTvMaxCount) * 100)}%`; }
    get tvBarStyle()      { return `width:${Math.round((this.tvCount    / this.movieTvMaxCount) * 100)}%`; }

    get maxRatingCount() {
        return Math.max(
            this.goatCount, this.perfectionCount,
            this.goodCount, this.timepassCount, this.disasterCount
        ) || 1;
    }

    get ratingBars() {
        return [
            { label: '🐐 GOAT',       count: this.goatCount,       fillStyle: `width:${Math.round((this.goatCount       / this.maxRatingCount)*100)}%; background:#F59E0B;` },
            { label: '✨ Perfection', count: this.perfectionCount, fillStyle: `width:${Math.round((this.perfectionCount / this.maxRatingCount)*100)}%; background:#8B5CF6;` },
            { label: '👍 Good',       count: this.goodCount,       fillStyle: `width:${Math.round((this.goodCount       / this.maxRatingCount)*100)}%; background:#10B981;` },
            { label: '😐 Timepass',   count: this.timepassCount,   fillStyle: `width:${Math.round((this.timepassCount   / this.maxRatingCount)*100)}%; background:#3B82F6;` },
            { label: '💀 Disaster',   count: this.disasterCount,   fillStyle: `width:${Math.round((this.disasterCount   / this.maxRatingCount)*100)}%; background:#EF4444;` }
        ];
    }

    get maxGenreCount() {
        if (!this.genreList.length) return 1;
        return Math.max(...this.genreList.map(g => g.count));
    }

    get sortedGenreList() {
        return [...this.genreList]
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(g => ({
                ...g,
                fillStyle: `width:${Math.round((g.count / this.maxGenreCount)*100)}%; background:#7C3AED;`
            }));
    }

    get ratingShelfRows() {
        return [
            { key: 'goat',       label: '🐐 GOAT',       dotStyle: 'background:#F59E0B; box-shadow:0 0 6px #F59E0B;', list: this.goatList       },
            { key: 'perfection', label: '✨ Perfection',  dotStyle: 'background:#8B5CF6; box-shadow:0 0 6px #8B5CF6;', list: this.perfectionList },
            { key: 'good',       label: '👍 Good',        dotStyle: 'background:#10B981; box-shadow:0 0 6px #10B981;', list: this.goodList       },
            { key: 'timepass',   label: '😐 Timepass',    dotStyle: 'background:#3B82F6; box-shadow:0 0 6px #3B82F6;', list: this.timepassList   },
            { key: 'disaster',   label: '💀 Disaster',    dotStyle: 'background:#EF4444; box-shadow:0 0 6px #EF4444;', list: this.disasterList   }
        ].filter(r => r.list.length > 0);
    }

    handleAIChatOpen()  { this.isAIChatOpen = true;  }
handleAIChatClose() { this.isAIChatOpen = false; }
    // ── Tab handler ───────────────────────────────────────────────
    handleTabClick(event) {
    const tab = event.currentTarget.dataset.tab;
    if (tab !== 'search') {
        this.searchResults = [];
        this.searchQuery   = '';
        this.searchDone    = false;
    }
    if (tab === 'dashboard') {
        refreshApex(this.wiredDashboardResult);
    }
    this.activeTab = tab;
}

    // ── Search handlers ───────────────────────────────────────────
    handleSearchInput(event) { this.searchQuery = event.target.value; }

    handleSearchKeyUp(event) {
        if (event.key === 'Enter') this.handleSearch();
    }

    handleSearchTypeToggle(event) {
        this.searchType    = event.currentTarget.dataset.type;
        this.searchResults = [];
        this.searchDone    = false;
    }

    handleSearch() {
        if (!this.searchQuery.trim()) return;
        this.isSearching = true;
        this.searchDone  = false;
        const apexCall   = this.searchType === 'Movie' ? searchMovies : searchTV;
        apexCall({ query: this.searchQuery })
            .then(results => {
                this.searchResults = results.map(r => ({
                    ...r,
                    posterSrc: r.posterURL ||
                               (r.type === 'TV Show' ? DEFAULT_TV_POSTER : DEFAULT_MOVIE_POSTER)
                }));
                this.isSearching = false;
                this.searchDone  = true;
            })
            .catch(error => {
                this.isSearching = false;
                this.searchDone  = true;
                this.showToast('Error', error.body.message, 'error');
            });
    }

    // ── Poster click handlers ─────────────────────────────────────
    handlePosterClick(event) {
        const id    = event.currentTarget.dataset.id;
        const movie = this.savedMovies.find(m => m.Id === id);
        this.selectedSavedMovie   = movie || null;
        this.selectedSearchResult = null;
        this.isDetailOpen         = true;
    }

    handleSearchPosterClick(event) {
        const tmdbId = event.currentTarget.dataset.tmdbid;
        const result = this.searchResults.find(r => String(r.tmdbId) === String(tmdbId));
        this.selectedSearchResult = result || null;
        this.selectedSavedMovie   = null;
        this.isDetailOpen         = true;
    }

    handleDashboardPosterClick(event) {
        const id    = event.currentTarget.dataset.id;
        const movie = this.savedMovies.find(m => m.Id === id);
        this.selectedSavedMovie   = movie || null;
        this.selectedSearchResult = null;
        this.isDetailOpen         = true;
    }

    // ── Modal handlers ────────────────────────────────────────────
    handleDetailClose() {
        this.isDetailOpen         = false;
        this.selectedSavedMovie   = null;
        this.selectedSearchResult = null;
    }

    handleModalSaved() {
        this.handleDetailClose();
        refreshApex(this.wiredMoviesResult);
    }

    handleModalDeleted() {
        this.handleDetailClose();
        refreshApex(this.wiredMoviesResult);
    }

    stopProp(event) { event.stopPropagation(); }

    // ── Toast ─────────────────────────────────────────────────────
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    refreshMovies() {
        return refreshApex(this.wiredMoviesResult);
    }
}