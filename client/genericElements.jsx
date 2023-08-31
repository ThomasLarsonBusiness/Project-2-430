// Imports
const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');

// Search Bar Component
const SearchBar = (props) => {    
    // Returns the Component
    // https://www.w3schools.com/html/html_form_elements.asp
    return(
        <form id='searchForm'
            onSubmit={props.callback}
            name='searchForm'
            action='/search'
            method='POST'
            className='searchForm'
            encType='multipart/form-data'
        >
            <label htmlFor='query'>Search:</label>
            <input id='searchQuery' type='text' name='query' placeholder='SEARCH HERE' />
            <select id='searchSelect' name='searchOptions'>
                <option value='/searchSong'>Song</option>
                <option value='/searchUser'>User</option>
            </select>
            <input type='submit' value='Search' />
        </form>
    );
};


// Account Dropdown Component
const AccountDropdown = (props) => {
    // Callback for when premium subscription checkbox is checked
    const updatePremium = (e) =>{
        helper.hideError();

        const checked = e.target.checked;

        helper.sendPost('/updatePremium', {subscribed: checked});
    };

    // Creates the List Elements depending if logged in or not
    // Conditional Rendering: https://legacy.reactjs.org/docs/conditional-rendering.html
    let actions;
    if (props.loggedIn){
        actions =
            <ul id='accountActions' className='hidden'>
                <li><a href={'/account?user=' + props.username} id='accountAction'>Account</a></li>
                <li><a href='/changePass' id='changePassAction'>Change Password</a></li>
                <li><a href='/logout' id='logoutAction'>Logout</a></li>
                <li>
                    <label for='premiumSub'>Premium Subscription: </label>
                    {props.subscribed ?
                        // Checkboxes: https://www.w3schools.com/tags/att_input_checked.asp
                        <input id='premiumSub' type='checkbox' onChange={updatePremium} checked/> :
                        <input id='premiumSub' type='checkbox' onChange={updatePremium}/>
                    }
                </li>
            </ul>;
    } else {
        actions =
            <ul id='accountActions' className='hidden'>
                <li><a href='/login' id='loginAction'>Login/Signup</a></li>
            </ul>;
    }
    
    // Returns the component to be rendered
    return(
        <div id='accountDropdown'>
            <h3 id='accountActionBtn' onClick={() => {
                const ulItem = document.getElementById('accountActions');
                if (ulItem.classList.contains('hidden')){
                    ulItem.classList.remove('hidden');
                } else {
                    ulItem.classList.add('hidden');
                }
            }}>Account Actions</h3>
            {actions}
        </div>
    );
};

// Song List Component
const SongList = (props) => {
    // If there are no songs found
    if(props.songs.length === 0){
        return (
            <div className='songList'>
                <h3 className='emptySong'>No Songs Yet!</h3>
            </div>
        );
    }

    // Maps the song to elements
    // Conditional Rendering: https://legacy.reactjs.org/docs/conditional-rendering.html
    const songNodes = props.songs.map(song => {
        // Checkbox: https://www.w3schools.com/tags/att_input_checked.asp
        return(
            <div key={song._id} className='song'>
                <h3 className='songName'>{song.name}</h3>
                <h3 className='songOwner'><a href={'/account?user=' + song.owner}>Artist: {song.owner}</a></h3>
                <audio controls src={'/retrieve?_id=' + song._id} />
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
            </div>
        );
    });

    // Returns the component to be rendered
    return(
        <div className='songList'>
            {songNodes}
        </div>
    );
};

// Account List Component
const AccountList = (props) => {
    // If there are no songs found
    if(props.users.length === 0){
        return (
            <div className='userList'>
                <h3 className='emptyUser'>No Users Found!</h3>
            </div>
        );
    }

    // Maps the song to elements
    const userNodes = props.users.map(user => {
        return(
            <div key={user._id} className='user'>
                <img className='accountHeart' src='/assets/img/logo.png' alt='logo' />
                <h3><a href={'/account?user=' + user.username}>User: {user.username}</a></h3>
            </div>
        );
    });

    // Returns the component to be rendered
    return(
        <div className='userList'>
            {userNodes}
        </div>
    );
};

// Function for checking if a user is logged in
const checkLogin = async () => {
    // Checks if logged in and gets the username
    const response = await fetch('/checkLogin');
    return result = await response.json();
}

// Checks if a song is liked
const songLiked = async (id) => {
    const response = await fetch(`/checkLike?id=${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const result = await response.json();
    return result.responseJson.result;
};

// Updates a liked checkbox
// https://www.w3schools.com/jsref/prop_checkbox_checked.asp
const updateLikedCheckbox = async () =>{
    const likedCheckboxes = document.getElementsByClassName('liked');
    if (likedCheckboxes){
        for (let i = 0; i < likedCheckboxes.length; i++){
            const result = await songLiked(likedCheckboxes[i].id)
            if (result){
                likedCheckboxes[i].checked = true;
            }
        }
    }
}

module.exports = {
    checkLogin,
    SearchBar,
    AccountDropdown,
    SongList,
    AccountList,
    songLiked,
    updateLikedCheckbox,
}