import { useState, useRef, Fragment, useContext, useEffect } from "react";
import useValidation from "../../hooks/useValidation";
import { IAuth, ILoginContainer, ILoginInput, ISignupInput } from "../../interfaces/types";
import Login from "../Login/Login";
import Signup from "../Signup/Signup";
import Alert from "../UI/Alert/Alert";
import Modal from "../UI/Modal/Modal";

import LOGIN_USER from '../../gql/loginUser';
import SIGNUP_USER from '../../gql/signupUser';
import { useLazyQuery, useMutation } from "@apollo/client";
import AuthContext from "../../store/auth-context";

const LoginContainer: React.FC<ILoginContainer> = ({ view, onClose, onSuccess }) => {
    const [viewType, setViewType] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [displayLoginError, setDisplayLoginError] = useState<boolean>(false);
    const [closeOnSuccess, setCloseOnSuccess] = useState<boolean>(false);

    const usernameRef = useRef<any>({});
    const passwordRef = useRef<any>({});
    const confirmPasswordRef = useRef<any>({});

    const [validate] = useValidation(setErrorMsg);

    const [login, { error: loginError, data: loginData, loading: loginLoading }] = useLazyQuery<{ auth: IAuth }, { login: ILoginInput }>(LOGIN_USER);
    const [signup, { error: signupError, data: signupData, loading: signupLoading, reset }] = useMutation<{ auth: IAuth }, { signup: ISignupInput }>(SIGNUP_USER);

    const authCtx = useContext(AuthContext);

    console.log('LoginContainer...');

    useEffect(() => {
        const auth: any = loginData || signupData;

        if (auth) {
            const { userId, token, tokenExpiration, username } = auth.login || auth.signup;

            authCtx.addAuth({ userId, token, tokenExpiration, username });

            setCloseOnSuccess(true);
            onSuccess();
        }

    }, [authCtx, loginData, onSuccess, signupData]);

    const handleSubmit = () => {
        const view = getViewType();
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;
        const confirmPassword = confirmPasswordRef.current?.value;

        setDisplayLoginError(false);
        reset();
        setCloseOnSuccess(false);

        const isValid = validate(username, password, confirmPassword, view);

        if (isValid) {
            if (view === 'Signup') {
                setDisplayLoginError(false)
                signup({ variables: { signup: { username, password, confirmPassword } } });
            } else {
                setDisplayLoginError(true)
                login({ variables: { login: { username, password } } });
            }
        }
    };

    const handleUsernameChange = (username: string) => {
        usernameRef.current.value = username;
        setErrorMsg('')
    };

    const handlePasswordChange = (password: string) => {
        passwordRef.current.value = password;
        setErrorMsg('')
    };

    const handleConfirmPasswordChange = (confirmPassword: string) => {
        confirmPasswordRef.current.value = confirmPassword;
        setErrorMsg('')
    };

    const getViewType = (): string => {
        return viewType ? viewType : view;
    }

    const handleToggleView = (view: string) => {
        setErrorMsg('');
        setViewType(view);
        reset();
        setDisplayLoginError(false);
    }

    return <Modal
        title={getViewType()}
        submitBtnName={getViewType()}
        closeOnSubmit={closeOnSuccess}
        disableSubmitBtn={false}
        isSubmitLoading={loginLoading || signupLoading}
        onClose={() => onClose()}
        onSubmit={handleSubmit}
        children={
            <Fragment>
                {errorMsg && <Alert msg={errorMsg} type="warning" ariaLabel="Warning:" fillType="#exclamation-triangle-fill" />}
                {(displayLoginError && loginError) && <Alert msg={loginError.message} type="danger" ariaLabel="Danger:" fillType="#exclamation-triangle-fill" />}
                {signupError && <Alert msg={signupError.message} type="danger" ariaLabel="Danger:" fillType="#exclamation-triangle-fill" />}

                {getViewType() === 'Login' ?
                    <Login onChangeUsername={handleUsernameChange}
                        onChangePassword={handlePasswordChange}
                        onToggleLogin={() => handleToggleView('Signup')} /> :

                    <Signup onChangeUsername={handleUsernameChange}
                        onChangePassword={handlePasswordChange}
                        onChangeConfirmPassword={handleConfirmPasswordChange}
                        onToggleSignup={() => handleToggleView('Login')} />}
            </Fragment>
        }
    />
};

export default LoginContainer;