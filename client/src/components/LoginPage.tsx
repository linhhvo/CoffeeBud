import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const response = await fetch(
                "http://localhost:8080/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ username, password }),
                },
            );

            // Parse the JSON response from the server
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Login failed.",
                );
            }

            navigate("/dashboard");
        } catch (error) {
            // Catch network errors or the manual errors we threw above
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("An unexpected network error occurred.");
            }
        } finally {
            // Regardless of success or failure, turn off the loading state
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
                Sign in to your account
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

                    {errorMessage && <p>{errorMessage}</p>}

                    <div>
                        <button
                            type="submit"
                            className="cursor-pointer flex w-full justify-center rounded-md bg-emerald-900 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        >
                            {isSubmitting ? "Logging in..." : "Login"}
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm/6 text-gray-400">
                    <Link
                        to={`/register`}
                        className="font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
};
export default LoginPage;