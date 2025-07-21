import type { Brand } from 'wellcrafted/brand';

type Password = Brand<'Password'> & string;
type Port = Brand<'Port'> & number;
type UserName = Brand<'UserName'> & string;

export const generateShellCommand = (
	port: Port,
	username: UserName,
	password: Password,
) => {
	return `opencode serve -p ${port} & ngrok http ${port} --basic-auth="${username}:${password}"; kill $!`;
};
