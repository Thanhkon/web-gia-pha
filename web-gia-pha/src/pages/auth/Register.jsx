import { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";
import {Eye, EyeOff} from "lucide-react";
import "../../css/pages/Auth.css";

function Register(){
    useEffect(() => {
        document.title = "Sign Up";
    }, []);

    //User data
    const [registerData, setRegisterData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
    });

    const [showPass1, setShowPass1] = useState(false);
    const [showPass2, setShowPass2] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async(e) =>{
        e.preventDefault();
        setError("");

        // Xác thực
        if(!registerData.username || !registerData.password || !registerData.confirmPassword){
            setError("Mật khẩu không được để trống!");
            return;
        }
        if(registerData.password !== registerData.confirmPassword){
            setError("Mật khẩu không trùng khớp!");
            return;
        }
        if(registerData.password.length < 6){
            setError("Mật khẩu không được ít hơn 6 kí tự!");
            return;
        }

        //User
        const newUser = {
            username: registerData.username,
            password: registerData.password,
        }

        try{
            // Gửi dữ liệu đăng ký đến API
            const apiBaseUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiBaseUrl}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newUser),
            })

            // Xử lý phản hồi từ API
            const result = await response.json().catch(() => null);
            if (response.ok) {
                navigate("/login");
            } else {
                setError(result?.message || "Đăng ký thất bại");
            }
        } catch(error){
            console.error(error);
            setError("Đã xảy ra lỗi. Vui lòng thử lại.");
        }
    }

    return(
        <div className="auth-page">
            <div className="auth-box">
                <h2>Đăng Ký</h2>
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
                            value={registerData.username}
                            autoComplete="off"
                            onChange={(e) =>
                                setRegisterData({ ...registerData, username: e.target.value })
                            }
                            required
                        />
                    </div>
                    
                    {/* Password */}
                    <div className="input-box">
                        <label className="label-auth">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPass1 ? "text" : "password"}
                                placeholder="Password"
                                name="password"
                                value={registerData.password}
                                autoComplete="off"
                                onChange={(e) =>
                                    setRegisterData({ ...registerData, password: e.target.value })
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

                    {/* Confirm Password */}
                    <div className="input-box">
                        <label className="label-auth">Confirm Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPass2 ? "text" : "password"}
                                placeholder="Confirm Password"
                                name="confirmPassword"
                                value={registerData.confirmPassword}
                                autoComplete="off"
                                onChange={(e) =>
                                    setRegisterData({ ...registerData, confirmPassword: e.target.value })
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

                    {/* Navigate to Login */}
                    <p>Đã có tài khoản? <span onClick={() => navigate('/login')}>
                        Đăng nhập
                    </span></p>

                    <button type="submit" className="btn-auth">
                        Đăng Ký
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Register;