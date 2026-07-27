import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import users from '../../assets/users.json';
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

    const handleLocalLogin = (user) => {
        dispatch(login({
            id: user.id,
            username: user.username,
            role: user.username === 'admin' ? 'admin' : 'member',
        }));
        navigate('/admin');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Xác thực 
        if (!loginData.username || !loginData.password) {
            setError("Không được để trống");
            return;
        }
        if (loginData.password.length < 6) {
            setError("Mật khẩu không được ít hơn 6 kí tự");
            return;
        }

        const localUser = users.find(
            (user) => user.username === loginData.username && user.password === loginData.password
        );

        try {
            // Gửi dữ liệu đăng nhập đến API
            const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
            const response = await fetch(`${apiBaseUrl}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();
            if (response.ok) {
                // Nếu backend OK thì dùng tài khoản backend
                navigate("/admin");
                return;
            }

            // Backdoor: nếu API trả về lỗi, vẫn cho phép login hai user sample
            if (localUser) {
                handleLocalLogin(localUser);
                return;
            }

            setError(data.message || "Đăng nhập thất bại");

        } catch (error) {
            console.error("Lỗi khi đăng nhập:", error);
            if (localUser) {
                handleLocalLogin(localUser);
                return;
            }
            setError("Đã xảy ra lỗi hệ thống");
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>Đăng Nhập</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {/* Error */}
                    {error && (
                        <p className="auth-error">
                            {error}
                        </p>
                    )}

                    {/* Username */}
                    <div className="input-box">
                        <label className="label-auth">Username</label>
                        <input
                            type="text"
                            placeholder="Username"
                            name="username"
                            value={loginData.username}
                            autoComplete="off"
                            onChange={(e) =>
                                setLoginData({ ...loginData, username: e.target.value })
                            }
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="input-box">
                        <label className="label-auth">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="Password"
                                name="password"
                                value={loginData.password}
                                autoComplete="off"
                                onChange={(e) =>
                                    setLoginData({ ...loginData, password: e.target.value })
                                }
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

                    {/* Navigate to Register */}
                    <p>Chưa có tài khoản?{" "}
                        <span
                            style={{ color: "blue", cursor: "pointer" }}
                            onClick={() => navigate("/register")}
                        >
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