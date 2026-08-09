import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import apiClient from "../../utils/apiClient";
import "../../css/pages/Auth.css";

function Register() {
    useEffect(() => {
        document.title = "Đăng Ký";
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

        if (
            !registerData.username ||
            !registerData.password ||
            !registerData.confirmPassword
        ) {
            setError("Nội dung không được để trống!");
            return;
        }

        if (registerData.password !== registerData.confirmPassword) {
            setError("Mật khẩu không trùng khớp!");
            return;
        }

        if (registerData.password.length < 6) {
            setError("Mật khẩu không được ít hơn 6 kí tự!");
            return;
        }

        try {
            await apiClient.post("/auth/register", {
                username: registerData.username,
                password: registerData.password,
            });
            navigate("/login");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Đăng ký thất bại");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>Đăng Ký</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <p className="auth-error">{error}</p>}

                    <div className="input-box">
                        <label className="label-auth">Username</label>
                        <input
                            type="text"
                            placeholder="Username"
                            name="username"
                            value={registerData.username}
                            autoComplete="off"
                            onChange={(inputEvent) =>
                                setRegisterData({
                                    ...registerData,
                                    username: inputEvent.target.value,
                                })
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
                                    setRegisterData({
                                        ...registerData,
                                        password: inputEvent.target.value,
                                    })
                                }
                                required
                            />
                            <button
                                onClick={() => setShowPass1(!showPass1)}
                                className="btn-showPass"
                                type="button"
                                tabIndex={-1}
                            >
                                {showPass1 ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
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
                                    setRegisterData({
                                        ...registerData,
                                        confirmPassword:
                                            inputEvent.target.value,
                                    })
                                }
                                required
                            />
                            <button
                                onClick={() => setShowPass2(!showPass2)}
                                className="btn-showPass"
                                type="button"
                                tabIndex={-1}
                            >
                                {showPass2 ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    <p>
                        Đã có tài khoản?{" "}
                        <span
                            style={{ color: "red", cursor: "pointer" }}
                            onClick={() => navigate("/login")}
                        >
                            Đăng nhập
                        </span>
                    </p>

                    <button type="submit" className="btn-auth">
                        Đăng Ký
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Register;
