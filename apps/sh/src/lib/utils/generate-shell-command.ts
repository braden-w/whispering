import type { Brand } from 'wellcrafted/brand';

type Port = number & Brand<'Port'>;
type UserName = string & Brand<'UserName'>;
type Password = string & Brand<'Password'>;

export const generateShellCommand = (
	port: Port,
	username: UserName,
	password: Password,
) => {
	return `opencode serve -p ${port} & ngrok http ${port} --basic-auth="${username}:${password}"; kill $!`;
};
