import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getFullDetails from '@salesforce/apex/CineLog_Controller.getFullDetails';
import saveMovie from '@salesforce/apex/CineLog_Controller.saveMovie';
import updateMovieLog from '@salesforce/apex/CineLog_Controller.updateMovieLog';
import deleteMovie from '@salesforce/apex/CineLog_Controller.deleteMovie';
import updateCustomPoster from '@salesforce/apex/CineLog_Controller.updateCustomPoster';

const DEFAULT_MOVIE_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%2313131A'/%3E%3Ctext x='150' y='210' text-anchor='middle' font-size='48' fill='%237C3AED'%3E%F0%9F%8E%AC%3C/text%3E%3Ctext x='150' y='270' text-anchor='middle' font-size='16' fill='%239CA3AF' font-family='sans-serif'%3ENo Poster%3C/text%3E%3C/svg%3E";

const DEFAULT_TV_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%2313131A'/%3E%3Ctext x='150' y='210' text-anchor='middle' font-size='48' fill='%237C3AED'%3E%F0%9F%93%BA%3C/text%3E%3Ctext x='150' y='270' text-anchor='middle' font-size='16' fill='%239CA3AF' font-family='sans-serif'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default class CineLogModal extends LightningElement {

    // ── Inputs from parent ────────────────────────────────────────
    // For saved movies pass the full Movie__c record
    @api savedMovie = null;
    // For search results pass the raw search result object
    @api searchResult = null;
    @track customPosterURL = '';
    @track isLoading = true;
    @track isSaving = false;
    @track details = {};
    @track selectedStatus = '';
    @track selectedRating = '';
    @track isStatusExpanded = false;
    @track isRatingExpanded = false;

    // ── Lifecycle ─────────────────────────────────────────────────
    connectedCallback() {
        this.loadDetails();
    }

    loadDetails() {
        this.isLoading = true;
        const tmdbId = this.savedMovie
            ? this.savedMovie.TMDB_ID__c
            : this.searchResult?.tmdbId;
        const type = this.savedMovie
            ? this.savedMovie.Type__c
            : this.searchResult?.type || 'Movie';

        if (!tmdbId) { this.isLoading = false; return; }

        // Pre-fill status/rating from saved movie
        if (this.savedMovie) {
            this.selectedStatus = this.savedMovie.Status__c || '';
            this.selectedRating = this.savedMovie.My_Rating__c || '';
        }

        getFullDetails({ tmdbId: parseInt(tmdbId), type })
            .then(data => {
                this.details = data || {};
                this.isLoading = false;
            })
            .catch(() => { this.isLoading = false; });
    }

    // ── Computed props ────────────────────────────────────────────
    get title() { return this.details.title || this.savedMovie?.Title__c || ''; }
    get overview() { return this.details.overview || this.savedMovie?.Overview__c || ''; }
    get director() { return this.details.director || this.savedMovie?.Director__c || ''; }
    get language() { return this.details.language ? this.details.language.toUpperCase() : ''; }
    get numberOfSeasons() { return this.details.numberOfSeasons || this.savedMovie?.Number_of_Seasons__c || ''; }
    get numberOfEpisodes() { return this.details.numberOfEpisodes || this.savedMovie?.Number_of_Episodes__c || ''; }
    get isTVShow() { return (this.details.type || this.savedMovie?.Type__c) === 'TV Show'; }
    get typeLabel() { return this.isTVShow ? '📺 TV Show' : '🎬 Movie'; }
    get isWatched() { return this.selectedStatus === 'Watched'; }
    get isSaved() { return !!this.savedMovie; }
    get saveLabel() { return this.isSaved ? '✔ Update' : '+ Add to List'; }

    get showPosterInput() {
    const hasTMDBPoster   = this.details.posterURL && this.details.posterURL !== '';
    const hasSavedPoster  = this.savedMovie?.Poster_URL__c || this.savedMovie?.Custom_Poster_URL__c;
    return !hasTMDBPoster && !hasSavedPoster;
}
    get posterSrc() {
    if (this.customPosterURL)                  return this.customPosterURL;
    if (this.savedMovie?.Custom_Poster_URL__c) return this.savedMovie.Custom_Poster_URL__c; 
    if (this.details.posterURL)                return this.details.posterURL;
    if (this.savedMovie?.Poster_URL__c)        return this.savedMovie.Poster_URL__c;
    return this.isTVShow ? DEFAULT_TV_POSTER : DEFAULT_MOVIE_POSTER;
}

    get backdropStyle() {
        return `background-image: url('${this.posterSrc}');`;
    }

    get year() {
        const d = this.details.releaseDate || this.savedMovie?.Release_Date__c || '';
        return d ? d.substring(0, 4) : '';
    }

    get runtimeLabel() {
        const rt = this.details.runtime || this.savedMovie?.Runtime__c;
        if (!rt) return '';
        const h = Math.floor(rt / 60);
        const m = rt % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    get hasGenres() { return !!this.details.genres; }
    get genreList() {
        return this.details.genres
            ? this.details.genres.split(',').map(g => g.trim())
            : [];
    }

    get hasCast() {
        return !!(this.details.castMembers || this.savedMovie?.Cast__c);
    }
    get castList() {
        const c = this.details.castMembers || this.savedMovie?.Cast__c || '';
        return c.split(',').map(a => a.trim()).filter(a => a);
    }

    // ── Status options ────────────────────────────────────────────
    get statusOptions() {
        const opts = [
            { value: 'Want to Watch', label: 'Want to Watch', icon: '🔖', color: 'purple' },
            { value: 'Watching', label: 'Watching', icon: '▶️', color: 'blue' },
            { value: 'Watched', label: 'Watched', icon: '✅', color: 'green' },
            { value: 'Dropped', label: 'Dropped', icon: '❌', color: 'red' }
        ];
        return opts.map(o => ({
            ...o,
            btnClass: `status-btn status-${o.color}${this.selectedStatus === o.value ? ' selected' : ''}`
        }));
    }

    // ── Rating options ────────────────────────────────────────────
    get ratingOptions() {
        const opts = [
            { value: 'GOAT', label: 'GOAT', icon: '🐐', color: 'goat' },
            { value: 'Perfection', label: 'Perfection', icon: '✨', color: 'perfection' },
            { value: 'Good', label: 'Good', icon: '👍', color: 'good' },
            { value: 'Timepass', label: 'Timepass', icon: '😐', color: 'timepass' },
            { value: 'Disaster', label: 'Disaster', icon: '💀', color: 'disaster' }
        ];
        return opts.map(o => ({
            ...o,
            btnClass: `rating-btn rating-${o.color}${this.selectedRating === o.value ? ' selected' : ''}`
        }));
    }
    get selectedStatusOption() {
        return this.statusOptions.find(o => o.value === this.selectedStatus)
            || { label: 'Select Status', icon: '🎬', btnClass: 'status-btn status-default' };
    }

    get selectedRatingOption() {
        return this.ratingOptions.find(o => o.value === this.selectedRating)
            || { label: 'Select Rating', icon: '⭐', btnClass: 'rating-btn rating-default' };
    }

    get showStatusDropdown() { return this.isStatusExpanded; }
    get showRatingDropdown() { return this.isRatingExpanded; }
    // ── Handlers ──────────────────────────────────────────────────
    handleStatusClick(event) {
        this.selectedStatus = event.currentTarget.dataset.value;
        this.isStatusExpanded = false;

        // Clear rating if status is not Watched
        if (this.selectedStatus !== 'Watched') {
            this.selectedRating = '';
            this.isRatingExpanded = false;
        }
    }
    handlePosterInput(event) {
        this.customPosterURL = event.target.value;
    }

    handleRatingClick(event) {
        this.selectedRating = event.currentTarget.dataset.value;
        this.isRatingExpanded = false;
    }
    handleStatusExpand() { this.isStatusExpanded = !this.isStatusExpanded; }
    handleRatingExpand() { this.isRatingExpanded = !this.isRatingExpanded; }

    handleSave() {
    if (!this.selectedStatus) {
        this.showToast('Select a status', 'Please choose a status first.', 'warning');
        return;
    }
    this.isSaving = true;

    if (this.isSaved) {
        const posterToSave = this.customPosterURL || null;
        updateMovieLog({
            movieId  : this.savedMovie.Id,
            status   : this.selectedStatus,
            myRating : this.selectedRating || null
        })
        .then(() => {
            if (posterToSave) {
                return updateCustomPoster({
                    movieId  : this.savedMovie.Id,
                    posterURL: posterToSave
                });
            }
        })
        .then(() => {
            this.isSaving = false;
            this.showToast('Updated!', 'Your list has been updated.', 'success');
            this.dispatchEvent(new CustomEvent('saved'));
        })
        .catch(e => {
            this.isSaving = false;
            this.showToast('Error', e.body?.message, 'error');
        });

    } else {
        const d          = this.details;
        // Explicitly resolve posterURL — empty string treated as null
        const posterURL = (d.posterURL && !d.posterURL.startsWith('data:'))
                  ? d.posterURL
                  : (this.customPosterURL || null);

        if (!d.tmdbId) {
            this.isSaving = false;
            this.showToast('Error', 'Could not load movie details. Try again.', 'error');
            return;
        }

        saveMovie({
            tmdbId           : d.tmdbId,
            title            : d.title            || null,
            overview         : d.overview         || null,
            releaseDate      : d.releaseDate       || null,
            posterURL        : posterURL,
            genres           : d.genres            || null,
            tmdbRating       : d.tmdbRating        || null,
            type             : d.type              || 'Movie',
            numberOfSeasons  : d.numberOfSeasons   || null,
            numberOfEpisodes : d.numberOfEpisodes  || null,
            showStatus       : d.showStatus        || null,
            director         : d.director          || null,
            runtime          : d.runtime           || null,
            castMembers      : d.castMembers        || null,
            status           : this.selectedStatus
        })
        .then(() => {
            this.isSaving = false;
            this.showToast('Added!', (d.title || 'Title') + ' added to your list.', 'success');
            this.dispatchEvent(new CustomEvent('saved'));
        })
        .catch(e => {
            this.isSaving = false;
            this.showToast('Error', e.body?.message || 'Something went wrong.', 'error');
        });
    }
}

    handleDelete() {
        deleteMovie({ movieId: this.savedMovie.Id })
            .then(() => {
                this.showToast('Removed', 'Movie removed from your list.', 'warning');
                this.dispatchEvent(new CustomEvent('deleted'));
            })
            .catch(e => this.showToast('Error', e.body?.message, 'error'));
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleOverlayClick() { this.handleClose(); }
    stopProp(event) { event.stopPropagation(); }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}