// Imports
const helper = require('./helper.js');
const generic = require('./genericElements.jsx');
const React = require('react');
const ReactDOM = require('react-dom');

// Displays the result of the search to the page
const displaySearch = (result, type) => {
    // Hides the search alert element
    document.getElementById('searchAlert').classList.add('hidden');

    // If there is an error, display it
    if (result.error) {
        return helper.handleError(result.error);
    }

    // If searching for a song
    if (type === '/searchSong') {
        // Check login
        const loggedIn = generic.checkLogin();

        // Render a SongList component to the view using the results
        ReactDOM.render(
            <generic.SongList songs={result.searchResult} loggedIn={loggedIn.loggedIn} />,
            document.getElementById('display')
        );

        // Update which songs the user has liked
        generic.updateLikedCheckbox();
    }
    else {
        // Render an AccountList component to the view using the results
        ReactDOM.render(
            <generic.AccountList users={result.searchResult} />,
            document.getElementById('display')
        );
    }
}

// Callback function to run when searching on this page
const searchCallback = async (e) => {
    e.preventDefault();
    helper.hideError();

    // Get the necesssary values
    const search = e.target.querySelector('#searchQuery').value;
    const type = e.target.querySelector('#searchSelect').value
    
    // If missing search, just return random songs
    if (!search) {
        return randomSong();
    }

    // If missing type, prevent search
    if (!type) {
        helper.handleError('Missing Search Parameter');
    }

    // Defines the search to fetch
    const url = `${type}?search=${search}`;
    
    // Shows the search alert element
    document.getElementById('searchAlert').classList.remove('hidden');
    
    // Fetches the search url and display the results
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    displaySearch(await response.json(), type);
}


// Gets random songs
const randomSong = async () => {
    // Gets the random songs and renders them to the page
    const response = await fetch('/getRandomSongs');
    const docs = await response.json();
    const loginResult = await generic.checkLogin();
    ReactDOM.render(<generic.SongList songs={docs.songs} loggedIn={loginResult.loggedIn}/>, document.getElementById('display'));

    // Updates the checkboxes
    generic.updateLikedCheckbox();
};

// Init function
const init = async () => {
    // Renders the SearchBar component to the screen
    ReactDOM.render(
        <generic.SearchBar callback={searchCallback} />,
        document.getElementById('search')
    );
    
    // Renders the SongList component to the screen
    ReactDOM.render(
        <generic.SongList songs={[]} loggedIn='false' />,
        document.getElementById('display')
    );

    // Finds random songs to be displayed by a SongList component
    randomSong();

    // Checks if the user is logged in
    const loginResult = await generic.checkLogin();

    // Checks if the user is subscribed
    let isSubscribed = false;
    if (loginResult.loggedIn){
        const response = await fetch('/checkPremium', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();
        isSubscribed = result.subscribed;
    }
    
    // Renders the AccountDropdown component to the screen
    ReactDOM.render(
        <generic.AccountDropdown loggedIn={loginResult.loggedIn} username={loginResult.username} subscribed={isSubscribed}/>,
        document.getElementById('header')
    );
}

// Runs the init function on load
window.onload = init;