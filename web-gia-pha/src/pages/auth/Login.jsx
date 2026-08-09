import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store/slices/authSlice";
import apiClient from "../../utils/apiClient";
import users from "../../assets/users.json";
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
    const dispatch = useDispatch();
    const primaryFamilyId = useSelector(
        (state) => state.settings.primaryFamilyId,
    );

    const handleSuccessLogin = () => {
        if (primaryFamilyId) {
            navigate(`/${primaryFamilyId}/home`);
        } else {
            navigate("/admin/families");
        }
    };

    const handleLocalLogin = (user) => {
        dispatch(
            login({
                id: user.id,
                username: user.username,
                role: user.username === "admin" ? "FAMILY_HEAD" : "MEMBER",
                familyId: "1",
                memberId: user.username === "admin" ? null : String(user.id),
                canCreatePost: user.username === "admin",
                canManagePosts: user.username === "admin",
            }),
        );
        handleSuccessLogin();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!loginData.username || !loginData.password) {
            setError("Không được để trống");
            return;
        }

        const localUser = users.find(
            (user) =>
                user.username === loginData.username &&
                user.password === loginData.password,
        );

        if (loginData.password.length < 6 && !localUser) {
            setError("Mật khẩu không được ít hơn 6 kí tự");
            return;
        }

        try {
            const response = await apiClient.post("/auth/login", {
                username: loginData.username,
                password: loginData.password,
            });

            dispatch(login(response.data));
            handleSuccessLogin();
        } catch (requestError) {
            console.error("Login failed:", requestError);
            if (localUser) {
                handleLocalLogin(localUser);
                return;
            }
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

                    <p>
                        Chưa có tài khoản?{" "}
                        <span
                            style={{ color: "red", cursor: "pointer" }}
                            onClick={() => navigate("/register")}
                        >
                            Đăng ký ngay
                        </span>
                    </p>
                    <button type="submit" className="btn-auth">
                        Đăng Nhập
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
