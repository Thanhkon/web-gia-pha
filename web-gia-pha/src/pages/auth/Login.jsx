import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../store/slices/authSlice";
import apiClient from "../../utils/apiClient";
import "../../css/pages/Auth.css";

function Login() {
    useEffect(() => {
        document.title = "Đăng Nhập";
    }, []);

    const [loginData, setLoginData] = useState({
        username: "",
        password: "",
    });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const handleSuccessLogin = async (userData) => {
        toast.success("Đăng nhập thành công!", {
            duration: 2000,
            icon: "👋",
        });
        const prevPath = location.state?.from?.pathname;
        if (prevPath && prevPath !== "/") {
            navigate(prevPath);
        } else if (userData?.preferredFamilyId) {
            navigate(`/${userData.preferredFamilyId}/home`);
        } else {
            // Tự động kiểm tra gia phả
            try {
                const response = await apiClient.get('/families');
                const families = response.data;
                if (families && families.length > 0) {
                    const firstFamilyId = families[0].id;
                    await apiClient.put("/users/profile", {
                        preferredFamilyId: Number(firstFamilyId),
                    });
                    // Cập nhật Redux store để lưu preferredFamilyId (nếu cần)
                    navigate(`/${firstFamilyId}/home`);
                } else {
                    navigate("/admin/families");
                }
            } catch (error) {
                console.error("Failed to check families:", error);
                navigate("/admin/families");
            }
        }
    };

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
            const response = await apiClient.post("/auth/login", {
                username: loginData.username,
                password: loginData.password,
            });

            dispatch(login(response.data));
            handleSuccessLogin(response.data.user);
        } catch (requestError) {
            console.error("Login failed:", requestError);
            setError(
                requestError.response?.data?.message || "Đăng nhập thất bại",
            );
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
                            onChange={(e) =>
                                setLoginData({
                                    ...loginData,
                                    username: e.target.value,
                                })
                            }
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
                                onChange={(e) =>
                                    setLoginData({
                                        ...loginData,
                                        password: e.target.value,
                                    })
                                }
                                required
                            />
                            <button
                                onClick={() => setShowPass(!showPass)}
                                className="btn-showPass"
                                type="button"
                                tabIndex={-1}
                            >
                                {showPass ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <p style={{ margin: 0 }}>
                            Chưa có tài khoản?{" "}
                            <span
                                style={{ color: "red", cursor: "pointer" }}
                                onClick={() => navigate("/register")}
                            >
                                Đăng ký
                            </span>
                        </p>
                        <p style={{ margin: 0 }}>
                            <span
                                style={{ color: "var(--primary-color)", cursor: "pointer" }}
                                onClick={() => navigate("/forgot-password")}
                            >
                                Quên mật khẩu?
                            </span>
                        </p>
                    </div>
                    <button type="submit" className="btn-auth" style={{ marginTop: '20px' }}>
                        Đăng Nhập
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
