import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../store/slices/authSlice";
import apiClient from "../../utils/apiClient";
import users from "../../assets/users.json";
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
            role: user.username === "admin" ? "FAMILY_HEAD" : "MEMBER",
            familyId: "1",
            memberId: user.username === "admin" ? null : String(user.id),
            canCreatePost: user.username === "admin",
            canManagePosts: user.username === "admin",
        }));
        navigate("/home");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!loginData.username || !loginData.password) {
            setError("Khong duoc de trong");
            return;
        }

        const localUser = users.find(
            (user) => user.username === loginData.username && user.password === loginData.password
        );

        if (loginData.password.length < 6 && !localUser) {
            setError("Mat khau khong duoc it hon 6 ki tu");
            return;
        }

        try {
            const response = await apiClient.post("/auth/login", {
                email: loginData.username,
                password: loginData.password,
            });

            dispatch(login(response.data));
            navigate("/home");
        } catch (requestError) {
            console.error("Login failed:", requestError);

            if (localUser) {
                handleLocalLogin(localUser);
                return;
            }

            setError(requestError.response?.data?.message || "Dang nhap that bai");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>Dang Nhap</h2>
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
                            placeholder="Username"
                            name="username"
                            value={loginData.username}
                            autoComplete="off"
                            onChange={(inputEvent) =>
                                setLoginData({ ...loginData, username: inputEvent.target.value })
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
                                onChange={(inputEvent) =>
                                    setLoginData({ ...loginData, password: inputEvent.target.value })
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

                    <p>Chua co tai khoan?{" "}
                        <span
                            style={{ color: "blue", cursor: "pointer" }}
                            onClick={() => navigate("/register")}
                        >
                            Dang ky ngay
                        </span>
                    </p>
                    <button type="submit" className="btn-auth">Dang Nhap</button>
                </form>
            </div>
        </div>
    );
}

export default Login;
