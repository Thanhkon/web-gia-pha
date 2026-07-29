import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import { loginApi } from "../../../api/authApi";
import "../../css/pages/Auth.css";

function Login() {
    useEffect(() => {
        document.title = "Sign In";
    }, []);

    const [loginData, setLoginData] = useState({
        username: "",
        password: "",
    });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!loginData.username || !loginData.password) {
            setError("Không được để trống");
            return;
        }
        if (loginData.password.length < 6) {
            setError("Mật khẩu không được ít hơn 6 kí tự");
            return;
        }

        try {
            const data = await loginApi(loginData);
            const token = data.token || data.accessToken;
            
            if (token) {
                localStorage.setItem("token", token);
                dispatch(login(data.user || loginData));
                navigate("/home");
                return;
            }

            setError(data.message || "Đăng nhập thất bại");

        } catch (err) {
            console.error("Lỗi khi đăng nhập:", err);
            setError(err.message || "Đã xảy ra lỗi hệ thống");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>Đăng Nhập</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <p className="auth-error">{error}</p>}

                    <div className="input-box">
                        <label className="label-auth">Username</label>
                        <input
                            type="text"
                            placeholder="Username"
                            name="username"
                            value={loginData.username}
                            autoComplete="off"
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-box">
                        <label className="label-auth">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="Password"
                                name="password"
                                value={loginData.password}
                                autoComplete="off"
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                required
                            />
                            <button
                                onClick={() => setShowPass(!showPass)}
                                className="btn-showPass"
                                type="button"
                                tabIndex={-1}
                            >
                                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    
                    <p>Chưa có tài khoản?{" "}
                        <span style={{ color: "blue", cursor: "pointer" }} onClick={() => navigate("/register")}>
                            Đăng ký ngay
                        </span>
                    </p>
                    <button type="submit" className="btn-auth">Đăng Nhập</button>
                </form>
            </div>
        </div>
    );
}

export default Login;