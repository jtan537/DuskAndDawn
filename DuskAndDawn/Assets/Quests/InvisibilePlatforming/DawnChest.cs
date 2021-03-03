using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Yarn.Unity;

public class DawnChest : MonoBehaviour
{
    VariableStorageBehaviour _varStorage;
    bool _recieveGem;
    private Animator _anim;
    // Start is called before the first frame update
    void Start()
    {
        _anim = gameObject.GetComponent<Animator>();
        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
    }

    // Update is called once per frame
    void Update()
    {
        _recieveGem = _varStorage.GetValue("$dawn_received_chest_gem").AsBool;
        if (_recieveGem)
        {
            _anim.SetBool("isOpen", true);
            GiveGem();
        }
    }

    private void GiveGem()
    {
        throw new System.NotImplementedException("Must complete function");
    }

}