import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import apiClient from "../../utils/apiClient";
import "../../css/pages/Auth.css";

function Register() {
    useEffect(() => {
        document.title = "Sign Up";
    }, []);

    const [registerData, setRegisterData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
    });
    const [showPass1, setShowPass1] = useState(false);
    const [showPass2, setShowPass2] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!registerData.username || !registerData.password || !registerData.confirmPassword) {
            setError("Khong duoc de trong");
            return;
        }

        if (registerData.password !== registerData.confirmPassword) {
            setError("Mat khau khong trung khop");
            return;
        }

        if (registerData.password.length < 6) {
            setError("Mat khau khong duoc it hon 6 ki tu");
            return;
        }

        try {
            await apiClient.post("/auth/register", {
                email: registerData.username,
                password: registerData.password,
                name: registerData.username,
            });
            navigate("/login");
        } catch (requestError) {
            console.error(requestError);
            setError(requestError.response?.data?.message || "Dang ky that bai");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>Dang Ky</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <p className="auth-error">
                            {error}
                        </p>
                    )}

                    <div className="input-box">
                        <label className="label-auth">Username</label>
                        <input
                            type="text"
                            placeholder="Email"
                            name="username"
                            value={registerData.username}
                            autoComplete="off"
                            onChange={(inputEvent) =>
                                setRegisterData({ ...registerData, username: inputEvent.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="input-box">
                        <label className="label-auth">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPass1 ? "text" : "password"}
                                placeholder="Password"
                                name="password"
                                value={registerData.password}
                                autoComplete="off"
                                onChange={(inputEvent) =>
                                    setRegisterData({ ...registerData, password: inputEvent.target.value })
                                }
                                required
                            />
                            <button
                                onClick={() => setShowPass1(!showPass1)}
                                className="btn-showPass"
                                type="button"
                                tabIndex={-1}
                            >
                                {showPass1 ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-box">
                        <label className="label-auth">Confirm Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPass2 ? "text" : "password"}
                                placeholder="Confirm Password"
                                name="confirmPassword"
                                value={registerData.confirmPassword}
                                autoComplete="off"
                                onChange={(inputEvent) =>
                                    setRegisterData({ ...registerData, confirmPassword: inputEvent.target.value })
                                }
                                required
                            />
                            <button
                                onClick={() => setShowPass2(!showPass2)}
                                className="btn-showPass"
                                type="button"
                                tabIndex={-1}
                            >
                                {showPass2 ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <p>Da co tai khoan? <span onClick={() => navigate("/login")}>
                        Dang nhap
                    </span></p>

                    <button type="submit" className="btn-auth">
                        Dang Ky
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Register;
