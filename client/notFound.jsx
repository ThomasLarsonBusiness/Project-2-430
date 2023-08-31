// Requires
const React = require('react');
const ReactDOM = require('react-dom');
const generic = require('./genericElements.jsx');

// Init function
const init = async () => {
    // Checks if Logged In
    const loginResult = await generic.checkLogin();
    
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
    
    // Renders the Account Dropdown
    ReactDOM.render(
        <generic.AccountDropdown loggedIn={loginResult.loggedIn} username={loginResult.username} subscribed={isSubscribed}/>,
        document.getElementById('header')
    );
}

// Runs the init function on load
window.onload = init; 