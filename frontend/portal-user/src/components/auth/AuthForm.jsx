// src/components/pages/AuthForm.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AuthForm({ mode, onSubmit, register, errors }) {
    const isSignup = mode === "signup";

    return (
            <div className="flex flex-row">
                <div className="relative h-screen w-2/4 flex items-center justify-center">
                    <img src="/assets/image1.png" alt="img-motif-pagne-africain" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white justify-center ">
                        <h1 className="mainFont text-7xl font-bold mb-10">Bienvenu</h1>
                        <p className="mainFont w-3/4 my-4 text-lg text-justify">
                            Carpe diem, quam minimum credula postero. Dum loquimur,
                            fugerit invida aetas. Hoc est enim hominem esse, non vitam
                            tantum agere, sed etiam sentire. Omnia praetereunt, sed
                            memoria manet. Vivamus igitur et amemus, dum adhuc lucet sol.
                        </p>
                        <br/>
                        <div className="flex flex-row items-center justify-center pt-10 pb-4 w-4/5 gap-6">
                            <hr className={isSignup ? "w-28": "w-36"}/>
                            {isSignup && (
                                <p className="mainFont text-2xl whitespce-nowrap">Inscrivez-vous avec</p>
                            )}
                            {!isSignup && (
                                <p className="mainFont text-2xl whitespace-nowrap">Connectez-vous avec</p>
                            )}
                            <hr className={isSignup ? "w-28": "w-36"}/>
                        </div>
                        <div className="flex flex-row items-center justify-center mt-4 gap-8">
                            <div className="bg-white p-5 rounded-lg ">
                                <img src="/assets/google.png" alt="Logo-google" className="w-8 h-8"/>
                            </div>
                            <div className="bg-white p-5 rounded-lg ">
                                <img src="/assets/facebook.png" alt="Logo-facebook" className="w-8 h-8"/>
                            </div>
                            <div className="bg-white p-5 rounded-lg ">
                                <img src="/assets/apple.png" alt="Logo-apple" className="w-8 h-8"/>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    {/*<img src="/assets/Group%207.png" alt="groupe-personne" className="relative h-96 top-40 -left-20"/>*/}
                    <form onSubmit={onSubmit} className={`flex h-screen flex-col justify-center align-center ${!isSignup ? "p-10" : "p-5"}`}>
                        <img src="/assets/E-noC-logo.png" alt="img-de-marque" className="w-40 h-20 m-auto" />

                        <div className="flex flex-row items-center justify-center gap-10 py-5">
                            <button type="button" className={`text-2xl  font-bold ${isSignup ? " font-bold border-b-4 border-black" : "text-gray-500"}`}>
                                <Link to="/signup">INSCRIPTION</Link>
                            </button>
                            <button type="button" className={`text-2xl font-bold ${isSignup ? "text-gray-500": "border-b-4 border-black"}`}>
                                <Link to="/login">CONNEXION</Link>
                            </button>
                        </div>

                        <p className={`bg-gray-200 p-2 rounded-lg w-2/4 m-auto ${isSignup ? "w-3/4" : "w-2/4"}`}>
                            Note: Prenez soin de bien entrer vos données
                            pour éviter des problèmes de connection
                        </p>

                        <div className={`flex flex-col items-start justify-center pt-5 m-auto ${isSignup ? "w-3/4" : "w-2/4"}`}>
                            <label className= "text-lg font-bold">Email</label>
                            <input
                                type="email"
                                className="bg-gray-200 w-full h-10 rounded-lg"
                                {...(isSignup && register ? register("email") : {})}
                                {...(!isSignup ? { required: true, name: "email" } : {})}
                            />
                            {isSignup && errors?.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                        </div>

                        <div className={`${isSignup ? "flex flex-row item-center justify-center w-3/4 m-auto gap-10" : ""}`}>
                            <div className={`${isSignup ? "flex flex-col w-1/2" : ""}`}>
                                <div className={`flex flex-col items-start justify-center m-auto ${isSignup ? "w-full" : "w-2/4 pt-5"}`}>
                                    <label className= "text-lg font-bold ">Mot de passe</label>
                                    <input
                                        type="password"
                                        className="bg-gray-200 w-full h-10 rounded-lg"
                                        {...(isSignup && register ? register("password") : {})}
                                        {...(!isSignup ? { required: true, name: "password" } : {})}
                                    />
                                    {isSignup && errors?.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                                </div>

                                {!isSignup && (
                                    <p className="text-red-400 w-1/2 m-auto cursor-pointer">Mots de passe oublie?</p>
                                )}
                            </div>

                            {isSignup && (
                                <div className="flex flex-col w-2/4 m-auto">
                                    <label className= "text-lg font-bold">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        className="bg-gray-200 w-full h-10 rounded-lg"
                                        {...(register ? register("confirmPassword") : {})}
                                    />
                                    {errors?.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                                </div>
                            )}
                        </div>

                        <div className={`flex flex-row items-center justify-center w-3/4 m-auto gap-10`}>
                            {isSignup && (
                                <div className=" w-3/4 m-auto">
                                    <label className= "text-lg font-bold">Numero de Telephone</label>
                                    <input
                                        type="text"
                                        className="bg-gray-200 w-full h-10 rounded-lg"
                                        {...(register ? register("phoneNumber") : {})}
                                    />
                                    {errors?.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>}
                                </div>
                            )}

                            {isSignup && (
                                <div className=" w-1/4 m-auto">
                                    <label className= "text-lg font-bold">Pays</label>
                                    <select
                                        defaultValue=""
                                        className={`bg-gray-200 w-full h-10 rounded-lg p-2`}
                                        {...(register ? register("pays") : {})}
                                    >
                                        <option value="">-- Sélectionnez --</option>
                                        <option value="ZA">Afrique du Sud</option>
                                        <option value="DZ">Algérie</option>
                                        <option value="AO">Angola</option>
                                        <option value="BJ">Bénin</option>
                                        <option value="BW">Botswana</option>
                                        <option value="BF">Burkina Faso</option>
                                        <option value="BI">Burundi</option>
                                        <option value="CV">Cap-Vert</option>
                                        <option value="CM">Cameroun</option>
                                        <option value="KM">Comores</option>
                                        <option value="CG">Congo</option>
                                        <option value="CI">Côte d’Ivoire</option>
                                        <option value="DJ">Djibouti</option>
                                        <option value="EG">Égypte</option>
                                        <option value="ER">Érythrée</option>
                                        <option value="SZ">Eswatini</option>
                                        <option value="ET">Éthiopie</option>
                                        <option value="GA">Gabon</option>
                                        <option value="GM">Gambie</option>
                                        <option value="GH">Ghana</option>
                                        <option value="GN">Guinée</option>
                                        <option value="GW">Guinée-Bissau</option>
                                        <option value="GQ">Guinée équatoriale</option>
                                        <option value="KE">Kenya</option>
                                        <option value="LS">Lesotho</option>
                                        <option value="LR">Libéria</option>
                                        <option value="LY">Libye</option>
                                        <option value="MG">Madagascar</option>
                                        <option value="MW">Malawi</option>
                                        <option value="ML">Mali</option>
                                        <option value="MA">Maroc</option>
                                        <option value="MU">Maurice</option>
                                        <option value="MR">Mauritanie</option>
                                        <option value="MZ">Mozambique</option>
                                        <option value="NA">Namibie</option>
                                        <option value="NE">Niger</option>
                                        <option value="NG">Nigeria</option>
                                        <option value="UG">Ouganda</option>
                                        <option value="CF">République centrafricaine</option>
                                        <option value="CD">République démocratique du Congo</option>
                                        <option value="RW">Rwanda</option>
                                        <option value="ST">Sao Tomé-et-Principe</option>
                                        <option value="SN">Sénégal</option>
                                        <option value="SC">Seychelles</option>
                                        <option value="SL">Sierra Leone</option>
                                        <option value="SO">Somalie</option>
                                        <option value="SD">Soudan</option>
                                        <option value="SS">Soudan du Sud</option>
                                        <option value="TZ">Tanzanie</option>
                                        <option value="TD">Tchad</option>
                                        <option value="TG">Togo</option>
                                        <option value="TN">Tunisie</option>
                                        <option value="ZM">Zambie</option>
                                        <option value="ZW">Zimbabwe</option>
                                    </select>
                                    {errors?.pays && <p className="text-red-500 text-sm mt-1">{errors.pays.message}</p>}
                                </div>
                            )}
                        </div>

                        <button type="submit" className="bg-mainColor font-bold text-white h-14 mt-10 rounded-lg w-2/4 m-auto">
                            {!isSignup ? "Se connecter" : "S'inscrire"}
                        </button>
                    </form>
                </div>

            </div>
    );
}
