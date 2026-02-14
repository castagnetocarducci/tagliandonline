
export const checkPasswordStrength = (password: string): boolean => {
    // 12 caratteri almeno una maiuscola, una minuscola, un numero e un carattere speciale
    const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*,.()\[\]/\\"'-]).{12,}$/;
    return regex.test(password);
}
