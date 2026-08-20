// Retorna os dados seguros do usuário autenticado.
export function meController(request, response) {
  const { user } = request.auth;

  response.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePhoto: user.profilePhoto,
      role: user.role,
      mfaRequired: user.mfaRequired,
    },
  });
}
