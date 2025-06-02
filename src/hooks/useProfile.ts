import { useState, useEffect } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import { useAuth } from '@/src/context/SupabaseAuthContext'

export const useProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar perfil do usuário atual
  const fetchProfile = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setProfile(data || null)
    } catch (err: any) {
      setError(err.message)
      console.error('Erro ao buscar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  // Criar ou atualizar perfil
  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) throw new Error('Usuário não autenticado')

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      console.error('Erro ao salvar perfil:', err)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  // Buscar perfil de outro usuário
  const getProfileById = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err: any) {
      console.error('Erro ao buscar perfil por ID:', err)
      return { data: null, error: err }
    }
  }

  // Buscar todos os perfis (para listagem)
  const getAllProfiles = async (limit = 50, offset = 0) => {
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data: data || [], error: null, count }
    } catch (err: any) {
      console.error('Erro ao buscar perfis:', err)
      return { data: [], error: err, count: 0 }
    }
  }

  // Buscar perfis por termo de pesquisa
  const searchProfiles = async (searchTerm: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('full_name')

      if (error) throw error
      return { data: data || [], error: null }
    } catch (err: any) {
      console.error('Erro ao pesquisar perfis:', err)
      return { data: [], error: err }
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
      setProfile(null)
    }
  }, [user])

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    getProfileById,
    getAllProfiles,
    searchProfiles,
  }
}
