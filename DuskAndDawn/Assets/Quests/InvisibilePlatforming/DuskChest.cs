using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Yarn.Unity;

public class DuskChest : MonoBehaviour
{
    VariableStorageBehaviour _varStorage;
    bool _recieveGem, _done = false;
    private Animator _anim;


    public GameObject gem;

    // Start is called before the first frame update
    void Start()
    {
     
        _anim = gameObject.GetComponent<Animator>();
        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
    }

    // Update is called once per frame
    void Update()
    {
        _recieveGem = _varStorage.GetValue("$dusk_received_chest_gem").AsBool;
        if (_recieveGem && !_done)
        {

           // GetComponent<AudioSource>().Play();
            _anim.SetBool("isOpen", true);
            GiveGem();
        }
    }

    private void GiveGem()
    {
        gem.SetActive(true);
        _done = true;
    }

}