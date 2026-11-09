import React from'react';import{Profile}from'../components/Profile';import{PortalHeader}from'./Portal';
export function ProfileStandalone({session,data,navigate}){return <main className="separate-shell profile-standalone"><PortalHeader session={session} navigate={navigate} title="PERFIL E CONFIGURAÇÕES"/><div className="standalone-content"><Profile session={session} data={data}/></div></main>}
