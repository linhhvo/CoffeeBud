import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {authService} from "../../apis/auth.service.ts";
import {useAuth} from "../../context/AuthContext.tsx";

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const navigate = useNavigate();

    const {setLoggedIn} = useAuth();

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        setErrorMessage("");
        setIsSubmitting(true);

        try {
            await authService.login({username, password});
            setLoggedIn();

            navigate("/dashboard");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Server can't process login request",);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (<div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
            Sign in to your account </h2>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm/6 font-medium text-gray-100">
                        Username
                    </label>
                    <div className="mt-2">
                        <input autoFocus id="username" name="username" value={username}
                               onChange={(e) => setUsername(e.target.value)} required
                               className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-700 sm:text-sm/6"/>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">
                            Password
                        </label>
                    </div>
                    <div className="mt-2">
                        <input id="password" type="password" name="password" value={password} required
                               onChange={(e) => setPassword(e.target.value)}
                               className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-700 sm:text-sm/6"/>
                    </div>
                </div>

                {errorMessage && <p>{errorMessage}</p>}

                <div>
                    <button type="submit" disabled={isSubmitting}
                            className="cursor-pointer flex w-full justify-center rounded-md bg-emerald-900 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                </div>
            </form>

            <p className="mt-10 text-center text-sm/6 text-gray-400">
                <Link to={`/register`} className="font-semibold text-emerald-400 hover:text-emerald-300">
                    Create an account
                </Link>
            </p>
        </div>
    </div>);
};
export default LoginPage;