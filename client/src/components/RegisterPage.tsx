import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../apis/auth.service.ts";

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [displayMsg, setDisplayMsg] = useState<string>("");

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        setDisplayMsg("");
        setIsSubmitting(true);

        try {
            await authService.register({ username, password });
            setDisplayMsg("Account created. Please log in.");
        } catch (error) {
            // Catch network errors or the manual errors we threw above
            if (error instanceof Error) {
                setDisplayMsg(error.message);
            } else {
                setDisplayMsg("An unexpected network error occurred.");
            }
        } finally {
            // Regardless of success or failure, turn off the loading state
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
                Create an account
            </h2>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form
                    onSubmit={handleSubmit}
                    method="POST"
                    className="space-y-6"
                >
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm/6 font-medium text-gray-100"
                        >
                            Username
                        </label>
                        <div className="mt-2">
                            <input
                                id="username"
                                name="username"
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => setUsername(e.target.value)}
                                required
                                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-700 sm:text-sm/6"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="password"
                                className="block text-sm/6 font-medium text-gray-100"
                            >
                                Password
                            </label>
                        </div>
                        <div className="mt-2">
                            <input
                                id="password"
                                type="password"
                                name="password"
                                required
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => setPassword(e.target.value)}
                                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-700 sm:text-sm/6"
                            />
                        </div>
                    </div>

                    {displayMsg && <p>{displayMsg}</p>}

                    <div>
                        <button
                            type="submit"
                            className="cursor-pointer flex w-full justify-center rounded-md bg-emerald-900 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        >
                            {isSubmitting ? "Registering..." : "Register"}
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm/6 text-gray-400">
                    <Link
                        to={`/login`}
                        className="font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                        Log in to an existing account
                    </Link>
                </p>
            </div>
        </div>
    );
};
export default LoginPage;