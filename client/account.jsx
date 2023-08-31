// Imports
const helper = require('./helper.js');
const generic = require('./genericElements.jsx');
const React = require('react');
const ReactDOM = require('react-dom');
const { result } = require('underscore');

// Displays the Search Results on the Webpage
const displaySearch = (result, type) => {
    // Hides the search alert element
    document.getElementById('searchAlert').classList.add('hidden');

    // If there is an error, display it
    if (result.error) {
        return helper.handleError(result.error);
    }
    
    // If searching for a song
    if (type === '/searchSong') {
        // Renders a generic SongList component using the result
        ReactDOM.render(
            <generic.SongList songs={result.searchResult} />,
            document.getElementById('display')
        );
    }
    // If searching for an account
    else {
        // Renders an AccountList component using the result
        ReactDOM.render(
            <generic.AccountList users={result.searchResult} />,
            document.getElementById('display')
        );
    }
}

// Callback funciton that is called when a user submits a search
const searchCallback = async (e) => {
    e.preventDefault();
    helper.hideError();

    // Gets the elements of the search bar
    const search = e.target.querySelector('#searchQuery').value;
    const type = e.target.querySelector('#searchSelect').value
    
    // If missing value, prevent search
    if (!search || !type) {
        helper.handleError('Missing Search Parameter');
    }

    // Defines the search url
    const url = `${type}?search=${search}`;

    // Shows the alert element
    document.getElementById('searchAlert').classList.remove('hidden');
    
    // Fetches the server for the search results
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Displays the results
    displaySearch(await response.json(), type);
}

// Callback function to handle uploading a song
const handleSong = async (e) => {
    // Prevent Default and Hide Error Message
    e.preventDefault();
    helper.hideError();

    // Attempts to upload the song
    const uploadResponse = await fetch('/songUp', {
        method: 'POST',
        body: new FormData(e.target),
    });

    // Parses the result
    const uploadResult = await uploadResponse.json();
    
    // If there is an error, display it
    if (uploadResult.error) {
        return helper.handleError(uploadResult.error);
    }

    // Reloads the songs for the user
    const pageUser = window.location.search.split('=')[1];
    const result = await generic.checkLogin();
    loadSongsFromServer(pageUser, result.loggedIn);

    return false;
};

// Song Upload Component
const SongForm = (props) => {
    // Returns the component for rendering
    // https://www.w3schools.com/html/html_form_elements.asp
    return(
        <form id='uploadForm'
            onSubmit={handleSong}
            name='uploadForm'
            action='/songUp'
            method='POST'
            className='uploadForm'
            encType='multipart/form-data'
        >
            <input id='fileUpload' type='file' name='songFile' />
            <label htmlFor='fileName'>Song Name:</label>
            <input id='fileNameInput' type='text' name='fileName' placeholder='Song Name' />
            <input className='uploadSongSubmit' type='submit' value='Upload Song!' />
        </form>
    );
    
};

// Song List Component
const SongList = (props) => {    
    // If there are no Songs
    if(props.songs.length === 0){
        return (
            <div className='songList'>
                <h1>User: {window.location.search.split('=')[1]}</h1>
                <h3 className='emptySong'>No Songs Yet!</h3>
            </div>
        );
    }

    // Maps the Songs to a Div
    // Conditional Rendering: https://legacy.reactjs.org/docs/conditional-rendering.html
    const songNodes = props.songs.map(song => {
        // Returns the form component
        // Has lots of variables to determine how elements will be rendered to the page
        // Checkbox: https://www.w3schools.com/tags/att_input_checked.asp
        return(
            <div key={song._id} className='song'>
                {!song.name ? 
                    <h3 className='songName'>Song Has Been Deleted</h3> : 
                    <h3 className='songName'>Name: {song.name}</h3>
                }
                {!song.name ?
                    <audio controls src='' /> :
                    <audio controls src={'/retrieve?_id=' + song._id} />
                }
                
                {props.loggedIn &&
                    <label for='like'>Like: </label> 
                }
                {props.loggedIn &&
                    <input id={song._id} class='liked' type='checkbox' onChange={(e) => {
                        const id = song._id;
                        const checked = e.target.checked;
                        helper.sendPost('/updateLiked', {id, checked});
                    }} /> 
                }
                {props.owner !== 'false' &&
                    <button hidden={props.owner} className='delete' type='button' onClick={async () => {
                        // Deletes the song from the database
                        const response = await fetch('/deleteSong', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({id: song._id}),
                        });

                        const pageUser = window.location.search.split('=')[1];
                        const result = await generic.checkLogin();
                        loadSongsFromServer(pageUser, result.loggedIn);
                    }}>Delete</button>
                }
            </div>
        );
    });
    

    // Returns the component for rendering
    return(
        <div className='songList'>
            <h1>User: {window.location.search.split('=')[1]}</h1>
            {songNodes}
        </div>
    );
};

// Loads Songss From a Server and Renders a SongList component
const loadSongsFromServer = async (user, _loggedIn) => {
    // Fetches the server for a user's songs
    const response = await fetch(`/retrieveUser${window.location.search}`);
    const data = await response.json();

    // If there is a redirect in the response, redirect the page
    if (data.redirect){
        return window.location.href = data.redirect;
    }

    // If there is an error, display it
    if (data.error){
        return helper.handleError(data.error);
    }

    // Renders a SongList component to the view using the result
    ReactDOM.render(
        <SongList songs={data.songs} owner={data.owner} loggedIn={_loggedIn}/>, document.getElementById('display')
    );

    // Updates the checkboxes
    generic.updateLikedCheckbox();
};

// Loads the songs to the page from the page
const loadAccountSongs = async (e) => {
    e.preventDefault();
    helper.hideError();

    // Loads the user's songs to the page
    const result = await generic.checkLogin();
    const pageUser = window.location.search.split('=')[1];

    // Loads the user's song to the client
    loadSongsFromServer(pageUser, result.loggedIn);
};

// Loads in the users liked songs
const loadLikedSongs = async (e) => {
    e.preventDefault();
    helper.hideError();

    // Attempts to load all of the user's liked songs
    const response = await fetch('/likedSongs', {
        method: 'GET',
        headers: {
            'content-type': 'application/json',
        }
    });
    const resJson = await response.json();

    // Creates an array of all of the song's info that can be input a SongList component
    const songInfo = [];
    for (let i = 0; i < resJson.ids.likedSongs.length; i++) {
        // Attempts to fetch the name of the song. If it has been deleted, the view will display an empty audio object
        const nameResponse = await fetch(`/getSongName?id=${resJson.ids.likedSongs[i]}`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
            }
        });
        const nameResJson = await nameResponse.json();

        songInfo.push({_id: resJson.ids.likedSongs[i], name: nameResJson.songName});
    }

    // Renders a SongList component using the info above
    ReactDOM.render(
        <SongList songs={songInfo} owner='false' loggedIn='true' />, document.getElementById('display')
    );

    // Updates the liked checkboxes on displayed songs
    generic.updateLikedCheckbox();
}

// Init
const init = async () => {
    // Checks if the user is logged in
    const loginResult = await generic.checkLogin();
    const account = window.location.search.split('=')[1];

    // Adds Functions to the Nav Buttons
    const mySongsBtn = document.getElementById('accountSongsButton');
    const likedSongsBtn = document.getElementById('likedSongsButton');

    mySongsBtn.addEventListener('click', loadAccountSongs);
    if (!loginResult.loggedIn || account !== loginResult.username) {
        likedSongsBtn.classList.add('hidden');
    }
    likedSongsBtn.addEventListener('click', loadLikedSongs);
    
    // Renders the Search Bar
    ReactDOM.render(
        <generic.SearchBar callback={searchCallback} />,
        document.getElementById('search')
    );

    // Tests if the user is logged in and logged into their own account
    const pageUser = window.location.search.split('=')[1];

    if (loginResult.loggedIn && pageUser === loginResult.username){
        ReactDOM.render(
            <SongForm />,
            document.getElementById('userData')
        );
    }

    // Renders an empty SongList component to the view
    ReactDOM.render(
        <SongList songs={[]} />,
        document.getElementById('display')
    );

    // Loads in the user's songs
    loadSongsFromServer(pageUser, loginResult.loggedIn);

    // Checks if the user is subscribed
    let isSubscribed = false;
    if (loginResult.loggedIn) {
        // Renders the Component to the screen
        const response = await fetch('/checkPremium', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();
        isSubscribed = result.subscribed;
    }
    
    // Renders an AccountDropdown to the view
    ReactDOM.render(
        <generic.AccountDropdown loggedIn={loginResult.loggedIn} username={loginResult.username} subscribed={isSubscribed}/>,
        document.getElementById('header')
    );
};

// Runs the init function on load
window.onload = init;