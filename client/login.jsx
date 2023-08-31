// Imports
const helper = require('./helper.js');
const generic = require('./genericElements.jsx');
const React = require('react');
const ReactDOM = require('react-dom');

// Handles a player logging in
const handleLogin = (e) => {
    // Prevents Default and Resets the Error Message
    e.preventDefault();
    helper.hideError();

    // Gets Parameters
    const username = e.target.querySelector('#user').value;
    const pass = e.target.querySelector('#pass').value;

    // If Missing Parameter
    if (!username || !pass) {
        helper.handleError('Username or Password is Empty!');
        return false;
    }

    // Sends the login
    helper.sendPost(e.target.action, {username, pass});

    return false;
};

// Handles a User Signing In
const handleSignup = (e) => {
    // Prevents Default and Resets the Error Message
    e.preventDefault();
    helper.hideError();

    // Gets the Parameters
    const username = e.target.querySelector('#user').value;
    const pass = e.target.querySelector('#pass').value;
    const pass2 = e.target.querySelector('#pass2').value;

    // Checks If Parameters are Present
    if(!username || !pass || !pass2) {
        helper.handleError('All Fields Are Required!');
        return false;
    }

    // Checks if Passwords Match
    if (pass !== pass2){
        helper.handleError('Passwords Do Not Match!');
        return false;
    }

    // Sends the Post to the Server
    helper.sendPost(e.target.action, {username, pass, pass2});
    return false;
};

// Handle Changing a user's password
// Handles a player logging in
const handleChangePassword = (e, username) => {
    // Prevents Default and Resets the Error Message
    e.preventDefault();
    helper.hideError();

    // Gets Parameters
    const oldPass = e.target.querySelector('#oldPass').value;
    const newPass = e.target.querySelector('#newPass').value;

    // If Missing Parameter
    if (!oldPass || !newPass || !username) {
        helper.handleError('Old or New Password is Empty!');
        return false;
    }

    // Sends the login
    helper.sendPost(e.target.action, {oldPass, newPass, username});

    return false;
};


// Login Component
const LoginWindow = (props) => {
    // Returns the form to be rendered
    return (
        <form id='loginForm'
            name='loginForm'
            onSubmit={handleLogin}
            action='/login'
            method='POST'
            className='mainForm'
        >
            <label htmlFor='username'>Username: </label>
            <input id='user' type='text' name='username' placeholder='username' />
            <label htmlFor='pass'>Password: </label>
            <input id='pass' type='password' name='pass' placeholder='password' />
            <input className='formSubmit' type='submit' value='Sign In' />
        </form>
    );
};

// SignUp Component
const SignupWindow = (props) => {
    // Returns the form to be rendered
    return (
        <form id='signupForm'
            name='signupForm'
            onSubmit={handleSignup}
            action='/signup'
            method='POST'
            className='mainForm'
        >
            <label htmlFor='username'>Username: </label>
            <input id='user' type='text' name='username' placeholder='username' />
            <label htmlFor='pass'>Password: </label>
            <input id='pass' type='password' name='pass' placeholder='password' />
            <label htmlFor='pass'>Password: </label>
            <input id='pass2' type='password' name='pass2' placeholder='retype password' />
            <input className='formSubmit' type='submit' value='Sign Up' />
        </form>
    );
};

// Change Password Component
const ChangePassWindow = (props) => {
    // Funciton to pass of password change to a callback function
    const handlePassChange = (e) => {
        const username = props.username;
        handleChangePassword(e, username);
    }
    
    // Renders the form to be rendered
    return (
        <form id='changePassForm'
            name='changePassForm'
            onSubmit={handlePassChange}
            action='/changePass'
            method='POST'
            className='mainForm'
        >
            <label htmlFor='oldPass'>Old Password: </label>
            <input id='oldPass' type='password' name='oldPass' placeholder='old password' />
            <label htmlFor='newPass'>New Password: </label>
            <input id='newPass' type='password' name='newPass' placeholder='new password' />
            <input className='formSubmit' type='submit' value='Change Password' />
        </form>
    );
}

// Init
const init = async () => {
    // Checks if the user is logged in
    const loginResult = await generic.checkLogin();
    
    // Checks if the logged in user is subscribed
    let isSubscribed = false;

    if (loginResult.loggedIn) {
        const response = await fetch('/checkPremium', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();
        isSubscribed = result.subscribed;
    }

    // Renders the account dropdown component to the screen
    ReactDOM.render(
        <generic.AccountDropdown loggedIn={loginResult.loggedIn} username={loginResult.username} subscribed={isSubscribed} />,
        document.getElementById('header')
    );

    // Gets Buttons
    const loginButton = document.getElementById('loginButton');
    const signupButton = document.getElementById('signupButton');

    // If the user is logged in
    if(loginResult.loggedIn){
        // Hides Unused Buttons
        loginButton.classList.add('hidden');
        signupButton.classList.add('hidden');

        // Renders the ChangePassWindow component to the view
        ReactDOM.render(<ChangePassWindow username={loginResult.username} />, document.getElementById('content'));
    } else {
        // Login Button Event
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Renders the LoginWindow component to the screen
            ReactDOM.render(<LoginWindow />, document.getElementById('content'));
            return false;
        });

        // Signup Button Event
        signupButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Renders the SignupWindow to the screen
            ReactDOM.render(<SignupWindow />, document.getElementById('content'));
            return false;
        });

        // Renders the LoginWindow component to the screen
        ReactDOM.render(<LoginWindow />, document.getElementById('content'));
    }
};

// Runs init when the window loads
window.onload = init;